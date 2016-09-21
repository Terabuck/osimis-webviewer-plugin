#include "WebViewer.h"

#include <typeinfo> // Fix gil 'bad_cast' not member of 'std' https://svn.boost.org/trac/boost/ticket/2483

#include <memory>
#include <boost/thread.hpp>
#include <boost/lexical_cast.hpp>
#include <EmbeddedResources.h>
#include <boost/filesystem.hpp>

#include <orthanc/OrthancCPlugin.h>
#include <Core/OrthancException.h>
#include <Core/Toolbox.h>
#include <Core/DicomFormat/DicomMap.h>
#include <Plugins/Samples/GdcmDecoder/GdcmDecoderCache.h>

#include "ViewerToolbox.h"
#include "OrthancContextManager.h"
#include "BaseController.h"
#include "Instance/DicomRepository.h"
#include "Series/SeriesRepository.h"
#include "Series/SeriesController.h"
#include "Image/ImageRepository.h"
#include "Image/ImageController.h"
#include "DecodedImageAdapter.h"
#include "Version.h"
#include "WebViewerConfiguration.h"

namespace
{
  // Needed locally for use by orthanc's callbacks
  OrthancPluginContext* s_context;
  const WebViewerConfiguration* s_config;

  // Call WebViewerConfiguration#parseFile and add logs accordingly
  void s_parseConfigFile(WebViewerConfiguration* config);

  void s_configureDicomDecoderPolicy();
  
  OrthancPluginErrorCode s_decodeImageCallback(OrthancPluginImage** target,
                                               const void* dicom,
                                               const uint32_t size,
                                               uint32_t frameIndex);
  
  bool s_isTransferSyntaxEnabled(const void* dicom,
                                 const uint32_t size);

  bool s_extractTransferSyntax(std::string& transferSyntax,
                               const void* dicom,
                               const uint32_t size);
}

#if ORTHANC_STANDALONE == 0
  static OrthancPluginErrorCode s_serveWebViewer(OrthancPluginRestOutput* output,
                                          const char* url,
                                          const OrthancPluginHttpRequest* request);
#else
  template <enum Orthanc::EmbeddedResources::DirectoryResourceId folder>
  static OrthancPluginErrorCode s_serveEmbeddedFolder(OrthancPluginRestOutput* output,
                                               const char* url,
                                               const OrthancPluginHttpRequest* request)
  {
    if (request->method != OrthancPluginHttpMethod_Get)
    {
      OrthancPluginSendMethodNotAllowed(s_context, output, "GET");
      return OrthancPluginErrorCode_Success;
    }

    std::string path = "/" + std::string(request->groups[0]);
    const char* mime = OrthancPlugins::GetMimeType(path);

    try
    {
      std::string s;
      Orthanc::EmbeddedResources::GetDirectoryResource(s, folder, path.c_str());

      const char* resource = s.size() ? s.c_str() : NULL;
      OrthancPluginAnswerBuffer(s_context, output, resource, s.size(), mime);

      return OrthancPluginErrorCode_Success;
    }
    catch (std::runtime_error& e)
    {
      std::string s = "Unknown static resource in plugin: " + std::string(request->groups[0]);
      OrthancPluginLogError(s_context, s.c_str());
      OrthancPluginSendHttpStatusCode(s_context, output, 404);
      return OrthancPluginErrorCode_Success;
    }
  }
#endif

bool WebViewer::_isOrthancCompatible()
{
  using namespace OrthancPlugins;
  std::string message;

  /* Check the version of the Orthanc core */
  if (OrthancPluginCheckVersion(_context) == 0)
  {
    char info[1024];
    sprintf(info, "Your version of Orthanc (%s) must be above %d.%d.%d to run this plugin",
            _context->orthancVersion,
            ORTHANC_PLUGINS_MINIMAL_MAJOR_NUMBER,
            ORTHANC_PLUGINS_MINIMAL_MINOR_NUMBER,
            ORTHANC_PLUGINS_MINIMAL_REVISION_NUMBER);
    OrthancPluginLogError(_context, info);
    return false;
  }
  else {
    return true;
  }
}

std::auto_ptr<WebViewerConfiguration> WebViewer::_createConfig()
{
  // Init config (w/ default values)
  WebViewerConfiguration* config = new WebViewerConfiguration(_context);

  // Parse config
  s_parseConfigFile(config); // may throw

  return std::auto_ptr<WebViewerConfiguration>(config);
}


void WebViewer::_serveBackEnd()
{
  // Register routes & controllers
  RegisterRoute<ImageController>("/osimis-viewer/images/");
  RegisterRoute<SeriesController>("/osimis-viewer/series/");

  // OrthancPluginRegisterRestCallbackNoLock(_context, "/osimis-viewer/is-stable-series/(.*)", IsStableSeries);
}

// @todo !!! resource as argument
void WebViewer::_serveFrontEnd()
{
  // @todo use common interface with RegisterRoute
#if ORTHANC_STANDALONE == 0
    OrthancPluginRegisterRestCallbackNoLock(_context, "/osimis-viewer/app/(.*)", s_serveWebViewer);
#else
    OrthancPluginRegisterRestCallbackNoLock(_context, "/osimis-viewer/app/(.*)", s_serveEmbeddedFolder<Orthanc::EmbeddedResources::WEB_VIEWER>);
#endif
}

void WebViewer::_plugToOrthancFrontEnd()
{
   // Extend the default Orthanc Explorer with custom JavaScript 
  std::string explorer;
  Orthanc::EmbeddedResources::GetFileResource(explorer, Orthanc::EmbeddedResources::ORTHANC_EXPLORER);
  OrthancPluginExtendOrthancExplorer(_context, explorer.c_str());
}

WebViewer::WebViewer(OrthancPluginContext* context)
{
  _context = context;

  OrthancContextManager::Set(_context); // weird // @todo inject

  // Instantiate repositories
  _dicomRepository = new DicomRepository;
  _imageRepository = new ImageRepository(_dicomRepository);
  _seriesRepository = new SeriesRepository(_dicomRepository);

  // Inject repositories within controllers (we can't do it without static method
  // since Orthanc API doesn't allow us to pass attributes when processing REST request)
  ImageController::Inject(_imageRepository);
  SeriesController::Inject(_seriesRepository);
}

int32_t WebViewer::start()
{
  // Share the context with the s_decodeImageCallback and other orthanc callbacks
  ::s_context = _context;

  // @note we don't do the work within the constructor to ensure we can benefit from polymorphism
  OrthancPluginLogWarning(_context, "Initializing the Web viewer");

  if (!_isOrthancCompatible()) {
    // @todo use exception instead of return code
    return -1;
  }

  // Set description
  OrthancPluginSetDescription(_context, "Provides a Web viewer of DICOM series within Orthanc.");

  // Set default configuration
  try {
    _config = _createConfig();
  }
  catch(...) {
    // @todo handle error logging at that level (or even upper -> better)
    // @todo use exception instead of return code
    return -1;
  }

  // Share the config with the s_decodeImageCallback and other orthanc callbacks
  ::s_config = _config.get();

  // Inject configuration within components
  _imageRepository->enableCachedImageStorage(_config->cachedImageStorageEnabled);

  // Configure DICOM decoder policy (GDCM/internal)
  s_configureDicomDecoderPolicy();

  // Register routes
  _serveBackEnd();
  _serveFrontEnd();

  // Integrate web viewer within Orthanc front end
  _plugToOrthancFrontEnd();

  // Return success
  return 0;
}

WebViewer::~WebViewer()
{
  OrthancPluginLogWarning(_context, "Finalizing the Web viewer");

  // Free repositories
  delete _seriesRepository;
  delete _imageRepository;
  delete _dicomRepository;
}

std::string WebViewer::getName() const
{
  return "osimis-web-viewer";
}

std::string WebViewer::getVersion() const
{
  return PRODUCT_VERSION_FULL_STRING;
}

namespace
{
  void s_parseConfigFile(WebViewerConfiguration* config)
  {
      try
      {
        config->parseFile();
      }
      catch (std::runtime_error& e)
      {
        OrthancPluginLogError(s_context, e.what());
        throw;
      }
      catch (Orthanc::OrthancException& e)
      {
        if (e.GetErrorCode() == Orthanc::ErrorCode_BadFileFormat)
        {
          OrthancPluginLogError(s_context, "Unable to read the configuration of the Web viewer plugin");
        }
        else
        {
          OrthancPluginLogError(s_context, e.What());
        }
        throw;
      }
  }

  void s_configureDicomDecoderPolicy()
  {
    // Configure the DICOM decoder
    if (s_config->gdcmEnabled)
    {
      // Replace the default decoder of DICOM images that is built in Orthanc
      OrthancPluginLogWarning(s_context, "Using GDCM instead of the DICOM decoder that is built in Orthanc");
      OrthancPluginRegisterDecodeImageCallback(s_context, s_decodeImageCallback);
    }
    else
    {
      OrthancPluginLogWarning(s_context, "Using the DICOM decoder that is built in Orthanc (not using GDCM)");
    }
  }

  OrthancPluginErrorCode s_decodeImageCallback(OrthancPluginImage** target,
                                               const void* dicom,
                                               const uint32_t size,
                                               uint32_t frameIndex)
  {
    try
    {
      if (!s_isTransferSyntaxEnabled(dicom, size))
      {
        *target = NULL;
        return OrthancPluginErrorCode_Success;
      }

      std::auto_ptr<OrthancPlugins::OrthancImageWrapper> image;

      OrthancPlugins::GdcmImageDecoder decoder(dicom, size);
      image.reset(new OrthancPlugins::OrthancImageWrapper(s_context, decoder.Decode(s_context, frameIndex)));

      *target = image->Release();

      return OrthancPluginErrorCode_Success;
    }
    catch (Orthanc::OrthancException& e)
    {
      *target = NULL;

      std::string s = "Cannot decode image using GDCM: " + std::string(e.What());
      OrthancPluginLogError(s_context, s.c_str());
      return OrthancPluginErrorCode_Plugin;
    }
    catch (std::runtime_error& e)
    {
      *target = NULL;

      std::string s = "Cannot decode image using GDCM: " + std::string(e.what());
      OrthancPluginLogError(s_context, s.c_str());
      return OrthancPluginErrorCode_Plugin;
    }
  }

  bool s_isTransferSyntaxEnabled(const void* dicom,
                                 const uint32_t size)
  {
    std::string formattedSize;

    {
      char tmp[16];
      sprintf(tmp, "%0.1fMB", static_cast<float>(size) / (1024.0f * 1024.0f));
      formattedSize.assign(tmp);
    }

    if (!s_config->restrictTransferSyntaxes)
    {
      std::string s = "Decoding one DICOM instance of " + formattedSize + " using GDCM";
      OrthancPluginLogInfo(s_context, s.c_str());
      return true;
    }

    std::string transferSyntax;
    if (!s_extractTransferSyntax(transferSyntax, dicom, size))
    {
      std::string s = ("Cannot extract the transfer syntax of this instance of " + 
                       formattedSize + ", will use GDCM to decode it");
      OrthancPluginLogInfo(s_context, s.c_str());
      return true;
    }

    if (s_config->enabledTransferSyntaxes.find(transferSyntax) != s_config->enabledTransferSyntaxes.end())
    {
      // Decoding for this transfer syntax is enabled
      std::string s = ("Using GDCM to decode this instance of " + 
                       formattedSize + " with transfer syntax " + transferSyntax);
      OrthancPluginLogInfo(s_context, s.c_str());
      return true;
    }
    else
    {
      std::string s = ("Won't use GDCM to decode this instance of " + 
                       formattedSize + ", as its transfer syntax " + transferSyntax + " is disabled");
      OrthancPluginLogInfo(s_context, s.c_str());
      return false;
    }
  }

  bool s_extractTransferSyntax(std::string& transferSyntax,
                               const void* dicom,
                               const uint32_t size)
  {
    Orthanc::DicomMap header;
    if (!Orthanc::DicomMap::ParseDicomMetaInformation(header, reinterpret_cast<const char*>(dicom), size))
    {
      return false;
    }

    const Orthanc::DicomValue* tag = header.TestAndGetValue(0x0002, 0x0010);
    if (tag == NULL ||
        tag->IsNull() ||
        tag->IsBinary())
    {
      return false;
    }
    else
    {
      // Stripping spaces should not be required, as this is a UI value
      // representation whose stripping is supported by the Orthanc
      // core, but let's be careful...
      transferSyntax = Orthanc::Toolbox::StripSpaces(tag->GetContent());
      return true;
    }
  }

#if ORTHANC_STANDALONE == 0
  OrthancPluginErrorCode s_serveWebViewer(OrthancPluginRestOutput* output,
                                          const char* url,
                                          const OrthancPluginHttpRequest* request)
  {
    if (request->method != OrthancPluginHttpMethod_Get)
    {
      OrthancPluginSendMethodNotAllowed(s_context, output, "GET");
      return OrthancPluginErrorCode_Success;
    }

    const std::string path = std::string(WEB_VIEWER_PATH) + std::string(request->groups[0]);
    const char* mime = OrthancPlugins::GetMimeType(path);
    
    std::string s;
    try
    {
      Orthanc::Toolbox::ReadFile(s, path);
      const char* resource = s.size() ? s.c_str() : NULL;
      OrthancPluginAnswerBuffer(s_context, output, resource, s.size(), mime);
    }
    catch (Orthanc::OrthancException&)
    {
      std::string s = "Inexistent file in served folder: " + path;
      OrthancPluginLogError(s_context, s.c_str());
      OrthancPluginSendHttpStatusCode(s_context, output, 404);
    }

    return OrthancPluginErrorCode_Success;
  }
#endif

}