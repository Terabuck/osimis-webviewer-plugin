#include "WebViewerConfiguration.h"

#include <orthanc/OrthancCPlugin.h>
#include <json/json.h>
#include <Core/OrthancException.h>

#include "ViewerToolbox.h"

void WebViewerConfiguration::parseFile()
{
  /* Read the configuration of the Web viewer */
  Json::Value configuration;
  if (!OrthancPlugins::ReadConfiguration(configuration, _context))
  {
    throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);    
  }

  static const char* CONFIG_WEB_VIEWER = "WebViewer";
  if (configuration.isMember(CONFIG_WEB_VIEWER))
  {

    static const char* CONFIG_GDCM_ENABLED = "GdcmEnabled";
    if (configuration[CONFIG_WEB_VIEWER].isMember(CONFIG_GDCM_ENABLED))
    {
      if (configuration[CONFIG_WEB_VIEWER][CONFIG_GDCM_ENABLED].type() != Json::booleanValue)
      {
        throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
      }
      else
      {
        gdcmEnabled = configuration[CONFIG_WEB_VIEWER][CONFIG_GDCM_ENABLED].asBool();
      }
    }
    
    if (configuration["WebViewer"].isMember("CacheEnabled") &&
        configuration["WebViewer"]["CacheEnabled"].type() == Json::booleanValue)
    {
      cachedImageStorageEnabled = configuration["WebViewer"]["CacheEnabled"].asBool();
    }

    static const char* CONFIG_RESTRICT_TRANSFER_SYNTAXES = "RestrictTransferSyntaxes";
    if (gdcmEnabled)
    {
      if (configuration[CONFIG_WEB_VIEWER].isMember(CONFIG_RESTRICT_TRANSFER_SYNTAXES))
      {
        const Json::Value& config = configuration[CONFIG_WEB_VIEWER][CONFIG_RESTRICT_TRANSFER_SYNTAXES];

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
  }
}
