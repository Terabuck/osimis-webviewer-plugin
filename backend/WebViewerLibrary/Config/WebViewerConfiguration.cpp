#include "WebViewerConfiguration.h"

#include <orthanc/OrthancCPlugin.h>
#include <json/json.h>
#include <Core/OrthancException.h>

#include "ViewerToolbox.h"


void WebViewerConfiguration::_parseFile(const Json::Value& wvConfig)
{
  // Enable GCM
  static const char* CONFIG_GDCM_ENABLED = "GdcmEnabled";
  if (wvConfig.isMember(CONFIG_GDCM_ENABLED))
  {
    if (wvConfig[CONFIG_GDCM_ENABLED].type() != Json::booleanValue)
    {
      throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
    }
    else
    {
      gdcmEnabled = wvConfig[CONFIG_GDCM_ENABLED].asBool();
    }
  }

  // Restrict GDCM usage to the specified transfer syntaxes
  static const char* CONFIG_RESTRICT_TRANSFER_SYNTAXES = "RestrictTransferSyntaxes";
  if (gdcmEnabled)
  {
    if (wvConfig.isMember(CONFIG_RESTRICT_TRANSFER_SYNTAXES))
    {
      const Json::Value& config = wvConfig[CONFIG_RESTRICT_TRANSFER_SYNTAXES];

      if (config.type() != Json::arrayValue)
      {
        throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
      }

      restrictTransferSyntaxes = true;
      for (Json::Value::ArrayIndex i = 0; i < config.size(); i++)
      {
        if (config[i].type() != Json::stringValue)
        {
          throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
        }
        else
        {
          std::string s = "Web viewer will use GDCM to decode transfer syntax " + config[i].asString();
          enabledTransferSyntaxes.insert(config[i].asString());
          OrthancPluginLogWarning(_context, s.c_str());
        }
      }
    }
  }
  
  // Enable cache
  if (wvConfig.isMember("CacheEnabled") &&
      wvConfig["CacheEnabled"].type() == Json::booleanValue)
  {
    cachedImageStorageEnabled = wvConfig["CacheEnabled"].asBool();
  }

  // Enable Study Download
  if (wvConfig.isMember("StudyDownloadEnabled") &&
      wvConfig["StudyDownloadEnabled"].type() == Json::booleanValue)
  {
    enableStudyDownload = wvConfig["StudyDownloadEnabled"].asBool();
  }
}

void WebViewerConfiguration::parseFile()
{
  /* Read the configuration of the Web viewer */
  try
  {
    Json::Value configuration;
    if (!OrthancPlugins::ReadConfiguration(configuration, _context))
    {
      throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);    
    }

    static const char* CONFIG_WEB_VIEWER = "WebViewer";
    if (configuration.isMember(CONFIG_WEB_VIEWER))
    {
      // Parse the config content using an overridable method.
      _parseFile(configuration[CONFIG_WEB_VIEWER]);
    }
  }
  /* Log on error and rethrow */
  catch (std::runtime_error& e)
  {
    OrthancPluginLogError(_context, e.what());
    throw;
  }
  catch (Orthanc::OrthancException& e)
  {
    if (e.GetErrorCode() == Orthanc::ErrorCode_BadFileFormat)
    {
      OrthancPluginLogError(_context, "Unable to read the configuration of the Web viewer plugin");
    }
    else
    {
      OrthancPluginLogError(_context, e.What());
    }
    throw;
  }
}

Json::Value WebViewerConfiguration::getFrontendConfig() const {
  Json::Value config;

  // Register "version" 
  // @todo move external requests out of model object (cleaner)
  {
    Json::Value system;
    if (!OrthancPlugins::GetJsonFromOrthanc(system, _context, "/system"))
    {
      throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_InexistentItem));
    }
    config["version"]["orthanc"] = system["Version"].asString();
    config["version"]["db"] = system["DatabaseVersion"].asString();
  }

  {
    Json::Value plugin;
    // @warning @todo don't use /plugins/*osimis-web-viewer* route !! May change in wv-pro
    if (!OrthancPlugins::GetJsonFromOrthanc(plugin, _context, "/plugins/osimis-web-viewer"))
    {
      throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_InexistentItem));
    }
    config["version"]["webviewer"] = plugin["Version"].asString();
  }

  // Register "enableStudyDownload"
  config["enableStudyDownload"] = enableStudyDownload;

  return config;
}