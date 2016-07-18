/**
 * Orthanc - A Lightweight, RESTful DICOM Store
 * Copyright (C) 2012-2016 Sebastien Jodogne, Medical Physics
 * Department, University Hospital of Liege, Belgium
 *
 * This program is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 **/

#include <typeinfo> // Fix gil 'bad_cast' not member of 'std' https://svn.boost.org/trac/boost/ticket/2483

#include <memory>
#include <boost/thread.hpp>
#include <boost/lexical_cast.hpp>
#include <EmbeddedResources.h>
#include <boost/filesystem.hpp>

#include "../Orthanc/Core/OrthancException.h"
#include "../Orthanc/Core/Toolbox.h"
#include "../Orthanc/Core/DicomFormat/DicomMap.h"
#include "ViewerToolbox.h"

#include "OrthancContextManager.h"
#include "BaseController.h"
#include "Instance/DicomRepository.h"
#include "Series/SeriesRepository.h"
#include "Series/SeriesController.h"
#include "Image/ImageRepository.h"
#include "Image/ImageController.h"
#include "DecodedImageAdapter.h"
#include "../Orthanc/Plugins/Samples/GdcmDecoder/GdcmDecoderCache.h"
#include "../Orthanc/Core/Toolbox.h"
#include "Version.h"

static OrthancPluginContext* context_ = NULL;
static bool restrictTransferSyntaxes_ = false;
static std::set<std::string> enabledTransferSyntaxes_;

#if ORTHANC_STANDALONE == 0
static OrthancPluginErrorCode ServeWebViewer(OrthancPluginRestOutput* output,
                                             const char* url,
                                             const OrthancPluginHttpRequest* request)
{
  if (request->method != OrthancPluginHttpMethod_Get)
  {
    OrthancPluginSendMethodNotAllowed(context_, output, "GET");
    return OrthancPluginErrorCode_Success;
  }

  const std::string path = std::string(WEB_VIEWER_PATH) + std::string(request->groups[0]);
  const char* mime = OrthancPlugins::GetMimeType(path);
  
  std::string s;
  try
  {
    Orthanc::Toolbox::ReadFile(s, path);
    const char* resource = s.size() ? s.c_str() : NULL;
    OrthancPluginAnswerBuffer(context_, output, resource, s.size(), mime);
  }
  catch (Orthanc::OrthancException&)
  {
    std::string s = "Inexistent file in served folder: " + path;
    OrthancPluginLogError(context_, s.c_str());
    OrthancPluginSendHttpStatusCode(context_, output, 404);
  }

  return OrthancPluginErrorCode_Success;
}
#else
template <enum Orthanc::EmbeddedResources::DirectoryResourceId folder>
static OrthancPluginErrorCode ServeEmbeddedFolder(OrthancPluginRestOutput* output,
                                                  const char* url,
                                                  const OrthancPluginHttpRequest* request)
{
  if (request->method != OrthancPluginHttpMethod_Get)
  {
    OrthancPluginSendMethodNotAllowed(context_, output, "GET");
    return OrthancPluginErrorCode_Success;
  }

  std::string path = "/" + std::string(request->groups[0]);
  const char* mime = OrthancPlugins::GetMimeType(path);

  try
  {
    std::string s;
    Orthanc::EmbeddedResources::GetDirectoryResource(s, folder, path.c_str());

    const char* resource = s.size() ? s.c_str() : NULL;
    OrthancPluginAnswerBuffer(context_, output, resource, s.size(), mime);

    return OrthancPluginErrorCode_Success;
  }
  catch (std::runtime_error& e)
  {
    std::string s = "Unknown static resource in plugin: " + std::string(request->groups[0]);
    OrthancPluginLogError(context_, s.c_str());
    OrthancPluginSendHttpStatusCode(context_, output, 404);
    return OrthancPluginErrorCode_Success;
  }
}
#endif

// static OrthancPluginErrorCode IsStableSeries(OrthancPluginRestOutput* output,
//                                              const char* url,
//                                              const OrthancPluginHttpRequest* request)
// {
//   try
//   {
//     if (request->method != OrthancPluginHttpMethod_Get)
//     {
//       OrthancPluginSendMethodNotAllowed(context_, output, "GET");
//       return OrthancPluginErrorCode_Success;
//     }

//     const std::string id = request->groups[0];
//     Json::Value series;

//     if (OrthancPlugins::GetJsonFromOrthanc(series, context_, "/series/" + id) &&
//         series.type() == Json::objectValue)
//     {
//       bool value = (series["IsStable"].asBool() ||
//                     series["Status"].asString() == "Complete");
//       std::string answer = value ? "true" : "false";
//       OrthancPluginAnswerBuffer(context_, output, answer.c_str(), answer.size(), "application/json");
//     }
//     else
//     {
//       OrthancPluginSendHttpStatusCode(context_, output, 404);
//     }

//     return OrthancPluginErrorCode_Success;
//   }
//   catch (Orthanc::OrthancException& e)
//   {
//     OrthancPluginLogError(context_, e.What());
//     return OrthancPluginErrorCode_Plugin;
//   }
//   catch (std::runtime_error& e)
//   {
//     OrthancPluginLogError(context_, e.what());
//     return OrthancPluginErrorCode_Plugin;
//   }
//   catch (boost::bad_lexical_cast&)
//   {
//     OrthancPluginLogError(context_, "Bad lexical cast");
//     return OrthancPluginErrorCode_Plugin;
//   }
// }

static bool ExtractTransferSyntax(std::string& transferSyntax,
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


static bool IsTransferSyntaxEnabled(const void* dicom,
                                    const uint32_t size)
{
  std::string formattedSize;

  {
    char tmp[16];
    sprintf(tmp, "%0.1fMB", static_cast<float>(size) / (1024.0f * 1024.0f));
    formattedSize.assign(tmp);
  }

  if (!restrictTransferSyntaxes_)
  {
    std::string s = "Decoding one DICOM instance of " + formattedSize + " using GDCM";
    OrthancPluginLogInfo(context_, s.c_str());
    return true;
  }

  std::string transferSyntax;
  if (!ExtractTransferSyntax(transferSyntax, dicom, size))
  {
    std::string s = ("Cannot extract the transfer syntax of this instance of " + 
                     formattedSize + ", will use GDCM to decode it");
    OrthancPluginLogInfo(context_, s.c_str());
    return true;
  }

  if (enabledTransferSyntaxes_.find(transferSyntax) != enabledTransferSyntaxes_.end())
  {
    // Decoding for this transfer syntax is enabled
    std::string s = ("Using GDCM to decode this instance of " + 
                     formattedSize + " with transfer syntax " + transferSyntax);
    OrthancPluginLogInfo(context_, s.c_str());
    return true;
  }
  else
  {
    std::string s = ("Won't use GDCM to decode this instance of " + 
                     formattedSize + ", as its transfer syntax " + transferSyntax + " is disabled");
    OrthancPluginLogInfo(context_, s.c_str());
    return false;
  }
}

static OrthancPluginErrorCode DecodeImageCallback(OrthancPluginImage** target,
                                                  const void* dicom,
                                                  const uint32_t size,
                                                  uint32_t frameIndex)
{
  try
  {
    if (!IsTransferSyntaxEnabled(dicom, size))
    {
      *target = NULL;
      return OrthancPluginErrorCode_Success;
    }

    std::auto_ptr<OrthancPlugins::OrthancImageWrapper> image;

    OrthancPlugins::GdcmImageDecoder decoder(dicom, size);
    image.reset(new OrthancPlugins::OrthancImageWrapper(context_, decoder.Decode(context_, frameIndex)));

    *target = image->Release();

    return OrthancPluginErrorCode_Success;
  }
  catch (Orthanc::OrthancException& e)
  {
    *target = NULL;

    std::string s = "Cannot decode image using GDCM: " + std::string(e.What());
    OrthancPluginLogError(context_, s.c_str());
    return OrthancPluginErrorCode_Plugin;
  }
  catch (std::runtime_error& e)
  {
    *target = NULL;

    std::string s = "Cannot decode image using GDCM: " + std::string(e.what());
    OrthancPluginLogError(context_, s.c_str());
    return OrthancPluginErrorCode_Plugin;
  }
}

void ParseConfiguration(bool& enableGdcm,
                        int& decodingThreads,
                        boost::filesystem::path& cachePath,
                        int& cacheSize,
                        bool& cachedImageStorageEnabled)
{
  /* Read the configuration of the Web viewer */
  Json::Value configuration;
  if (!OrthancPlugins::ReadConfiguration(configuration, context_))
  {
    throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);    
  }

  static const char* CONFIG_WEB_VIEWER = "WebViewer";
  if (configuration.isMember(CONFIG_WEB_VIEWER))
  {

    decodingThreads = OrthancPlugins::GetIntegerValue(configuration[CONFIG_WEB_VIEWER], "Threads", decodingThreads);

    static const char* CONFIG_ENABLE_GDCM = "EnableGdcm";
    if (configuration[CONFIG_WEB_VIEWER].isMember(CONFIG_ENABLE_GDCM))
    {
      if (configuration[CONFIG_WEB_VIEWER][CONFIG_ENABLE_GDCM].type() != Json::booleanValue)
      {
        throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
      }
      else
      {
        enableGdcm = configuration[CONFIG_WEB_VIEWER][CONFIG_ENABLE_GDCM].asBool();
      }
    }
    
    if (configuration["WebViewer"].isMember("CacheEnabled") &&
        configuration["WebViewer"]["CacheEnabled"].type() == Json::booleanValue)
    {
      cachedImageStorageEnabled = configuration["WebViewer"]["CacheEnabled"].asBool();
    }

    static const char* CONFIG_RESTRICT_TRANSFER_SYNTAXES = "RestrictTransferSyntaxes";
    if (enableGdcm)
    {
      if (configuration[CONFIG_WEB_VIEWER].isMember(CONFIG_RESTRICT_TRANSFER_SYNTAXES))
      {
        const Json::Value& config = configuration[CONFIG_WEB_VIEWER][CONFIG_RESTRICT_TRANSFER_SYNTAXES];

        if (config.type() != Json::arrayValue)
        {
          throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
        }

        restrictTransferSyntaxes_ = true;
        for (Json::Value::ArrayIndex i = 0; i < config.size(); i++)
        {
          if (config[i].type() != Json::stringValue)
          {
            throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
          }
          else
          {
            std::string s = "Web viewer will use GDCM to decode transfer syntax " + config[i].asString();
            enabledTransferSyntaxes_.insert(config[i].asString());
            OrthancPluginLogWarning(context_, s.c_str());
          }
        }
      }
    }
  }

  if (decodingThreads <= 0 ||
      cacheSize <= 0)
  {
    throw Orthanc::OrthancException(Orthanc::ErrorCode_ParameterOutOfRange);
  }

}


DicomRepository* dicomRepository;
ImageRepository* imageRepository;
SeriesRepository* seriesRepository;


extern "C"
{
  ORTHANC_PLUGINS_API int32_t OrthancPluginInitialize(OrthancPluginContext* context)
  {
    using namespace OrthancPlugins;
    std::string message;

    OrthancContextManager::Set(context);

    context_ = context;
    OrthancPluginLogWarning(context_, "Initializing the Web viewer");


    /* Check the version of the Orthanc core */
    if (OrthancPluginCheckVersion(context_) == 0)
    {
      char info[1024];
      sprintf(info, "Your version of Orthanc (%s) must be above %d.%d.%d to run this plugin",
              context_->orthancVersion,
              ORTHANC_PLUGINS_MINIMAL_MAJOR_NUMBER,
              ORTHANC_PLUGINS_MINIMAL_MINOR_NUMBER,
              ORTHANC_PLUGINS_MINIMAL_REVISION_NUMBER);
      OrthancPluginLogError(context_, info);
      return -1;
    }

    OrthancPluginSetDescription(context_, "Provides a Web viewer of DICOM series within Orthanc.");


    /* By default, use half of the available processing cores for the decoding of DICOM images */
    int decodingThreads = boost::thread::hardware_concurrency() / 2;
    if (decodingThreads == 0)
    {
      decodingThreads = 1;
    }

    /* By default, use GDCM */
    bool enableGdcm = true;
    /* By default, a cache of 100 MB is used */
    int cacheSize = 100; 

    /* By default, enable storage attachment cache */
    bool cachedImageStorageEnabled = false;

    try
    {
      boost::filesystem::path cachePath;
      ParseConfiguration(enableGdcm, decodingThreads, cachePath, cacheSize, cachedImageStorageEnabled);

      std::string message = ("Web viewer using " + boost::lexical_cast<std::string>(decodingThreads) + 
                             " threads for the decoding of the DICOM images");
      OrthancPluginLogWarning(context_, message.c_str());
    }
    catch (std::runtime_error& e)
    {
      OrthancPluginLogError(context_, e.what());
      return -1;
    }
    catch (Orthanc::OrthancException& e)
    {
      if (e.GetErrorCode() == Orthanc::ErrorCode_BadFileFormat)
      {
        OrthancPluginLogError(context_, "Unable to read the configuration of the Web viewer plugin");
      }
      else
      {
        OrthancPluginLogError(context_, e.What());
      }
      return -1;
    }


    /* Configure the DICOM decoder */
    if (enableGdcm)
    {
      // Replace the default decoder of DICOM images that is built in Orthanc
      OrthancPluginLogWarning(context_, "Using GDCM instead of the DICOM decoder that is built in Orthanc");
      OrthancPluginRegisterDecodeImageCallback(context_, DecodeImageCallback);
    }
    else
    {
      OrthancPluginLogWarning(context_, "Using the DICOM decoder that is built in Orthanc (not using GDCM)");
    }


    // Instantiate repositories
    DicomRepository* dicomRepository = new DicomRepository;
    ImageRepository* imageRepository = new ImageRepository(dicomRepository);
    SeriesRepository* seriesRepository = new SeriesRepository(dicomRepository);
    imageRepository->enableCachedImageStorage(cachedImageStorageEnabled);

    ImageController::Inject(imageRepository);
    SeriesController::Inject(seriesRepository);

    // Register routes & controllers
    RegisterRoute<ImageController>("/osimis-viewer/images/");
    RegisterRoute<SeriesController>("/osimis-viewer/series/");

    // OrthancPluginRegisterRestCallbackNoLock(context_, "/osimis-viewer/is-stable-series/(.*)", IsStableSeries);

    // @todo use common interface with RegisterRoute
#if ORTHANC_STANDALONE == 1
    OrthancPluginRegisterRestCallbackNoLock(context, "/osimis-viewer/app/(.*)", ServeEmbeddedFolder<Orthanc::EmbeddedResources::WEB_VIEWER>);
#else
    OrthancPluginRegisterRestCallbackNoLock(context, "/osimis-viewer/app/(.*)", ServeWebViewer);
#endif

    /* Extend the default Orthanc Explorer with custom JavaScript */
    std::string explorer;
    Orthanc::EmbeddedResources::GetFileResource(explorer, Orthanc::EmbeddedResources::ORTHANC_EXPLORER);
    OrthancPluginExtendOrthancExplorer(context_, explorer.c_str());

    return 0;
  }


  ORTHANC_PLUGINS_API void OrthancPluginFinalize()
  {
    OrthancPluginLogWarning(context_, "Finalizing the Web viewer");

    // Free repositories
    delete seriesRepository;
    delete imageRepository;
    delete dicomRepository;
  }


  ORTHANC_PLUGINS_API const char* OrthancPluginGetName()
  {
    return "osimis-web-viewer";
  }


  ORTHANC_PLUGINS_API const char* OrthancPluginGetVersion()
  {
    return PRODUCT_VERSION_FULL_STRING;
  }
}
