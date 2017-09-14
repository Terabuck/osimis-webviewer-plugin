#include "WebViewerConfiguration.h"

#include <orthanc/OrthancCPlugin.h>
#include <json/json.h>
#include <Core/OrthancException.h>
#include <boost/thread.hpp>
#include <algorithm>

#include "ViewerToolbox.h"


WebViewerConfiguration::WebViewerConfiguration(OrthancPluginContext* context)
  : _context(context)
{
}


void WebViewerConfiguration::_parseFile(const Json::Value& wvConfig)
{
  // By default, set these windowing presets. note, these are the default values sent to the frontend -> they are in mixedCase (in the settings, they are in CamelCase)
  windowingPresets = Json::Value(Json::arrayValue);
  windowingPresets.append(Json::Value(Json::arrayValue));
  windowingPresets[0] = Json::Value(Json::objectValue);
  windowingPresets[0]["name"] = "Ct Lung";
  windowingPresets[0]["windowCenter"] = -400;
  windowingPresets[0]["windowWidth"] = 1600;
  windowingPresets[1] = Json::Value(Json::objectValue);
  windowingPresets[1]["name"] = "Ct Abdomen";
  windowingPresets[1]["windowCenter"] = 300;
  windowingPresets[1]["windowWidth"] = 1500;
  windowingPresets[2] = Json::Value(Json::objectValue);
  windowingPresets[2]["name"] = "Ct Bone";
  windowingPresets[2]["windowCenter"] = 40;
  windowingPresets[2]["windowWidth"] = 80;
  windowingPresets[3] = Json::Value(Json::objectValue);
  windowingPresets[3]["name"] = "Ct Brain";
  windowingPresets[3]["windowCenter"] = 40;
  windowingPresets[3]["windowWidth"] = 400;
  windowingPresets[4] = Json::Value(Json::objectValue);
  windowingPresets[4]["name"] = "Ct Chest";
  windowingPresets[4]["windowCenter"] = -400;
  windowingPresets[4]["windowWidth"] = 1600;
  windowingPresets[5] = Json::Value(Json::objectValue);
  windowingPresets[5]["name"] = "Ct Angio";
  windowingPresets[5]["windowCenter"] = 300;
  windowingPresets[5]["windowWidth"] = 600;


  gdcmEnabled = OrthancPlugins::GetBoolValue(wvConfig, "GdcmEnabled", true);
  // By default, use GDCM for everything.
  restrictTransferSyntaxes = false;

  // Restrict GDCM usage to the specified transfer syntaxes
  if (gdcmEnabled)
  {
    static const char* CONFIG_RESTRICT_TRANSFER_SYNTAXES = "RestrictTransferSyntaxes";
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

  // Retrieve windowing preset (if set).
  if (wvConfig.isMember("WindowingPresets") &&
      wvConfig["WindowingPresets"].type() == Json::arrayValue)
  {
    windowingPresets = windowingPresets = Json::Value(Json::arrayValue);  // remove default values

    for (Json::Value::ArrayIndex i = 0; i < wvConfig["WindowingPresets"].size(); i++)
    {
      Json::Value preset = wvConfig["WindowingPresets"][i];
      if (preset.type() != Json::objectValue)
        throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
      else
      {
        windowingPresets[i] = Json::Value(Json::objectValue);
        windowingPresets[i]["name"] = preset["Name"];
        windowingPresets[i]["windowCenter"] = preset["WindowCenter"];
        windowingPresets[i]["windowWidth"] = preset["WindowWidth"];
      }
    }
  }

  persistentCachedImageStorageEnabled = OrthancPlugins::GetBoolValue(wvConfig, "CacheEnabled", false);
  studyDownloadEnabled = OrthancPlugins::GetBoolValue(wvConfig, "StudyDownloadEnabled", true);
  videoDisplayEnabled = OrthancPlugins::GetBoolValue(wvConfig, "VideoDisplayEnabled", true);
  annotationStorageEnabled = OrthancPlugins::GetBoolValue(wvConfig, "AnnotationStorageEnabled", false);
  keyImageCaptureEnabled = OrthancPlugins::GetBoolValue(wvConfig, "KeyImageCaptureEnabled", false);
  showStudyInformationBreadcrumb = OrthancPlugins::GetBoolValue(wvConfig, "ShowStudyInformationBreadcrumb", false);
  shortTermCachePrefetchOnInstanceStored = OrthancPlugins::GetBoolValue(wvConfig, "ShortTermCachePrefetchOnInstanceStored", false);
  shortTermCacheEnabled = OrthancPlugins::GetBoolValue(wvConfig, "ShortTermCacheEnabled", true);
  shortTermCacheDebugLogsEnabled = OrthancPlugins::GetBoolValue(wvConfig, "ShortTermCacheDebugLogsEnabled", false);
  shortTermCachePath = OrthancPlugins::GetStringValue(wvConfig, "ShortTermCachePath", shortTermCachePath.string());
  shortTermCacheSize = OrthancPlugins::GetIntegerValue(wvConfig, "ShortTermCacheSize", 1000);
  shortTermCacheDecoderThreadsCound = OrthancPlugins::GetIntegerValue(wvConfig, "Threads", std::max(boost::thread::hardware_concurrency() / 2, 1u));
  highQualityImagePreloadingEnabled = OrthancPlugins::GetBoolValue(wvConfig, "HighQualityImagePreloadingEnabled", true);
  reduceTimelineHeightOnSingleFrameSeries = OrthancPlugins::GetBoolValue(wvConfig, "ReduceTimelineHeightOnSingleFrameSeries", false);
  showNoReportIconInSeriesList = OrthancPlugins::GetBoolValue(wvConfig, "ShowNoReportIconInSeriesList", false);
  toolbarLayoutMode = OrthancPlugins::GetStringValue(wvConfig, "ToolbarLayoutMode", "flat");
  toolbarButtonSize = OrthancPlugins::GetStringValue(wvConfig, "ToolbarButtonSize", "small");

  if (toolbarLayoutMode != "flat" && toolbarLayoutMode != "tree")
  {
    OrthancPluginLogError(_context, "ToolbarLayoutMode invalid value.  Allowed values are \"flat\" and \"tree\"");
    throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
  }

  if (toolbarButtonSize != "small" && toolbarButtonSize != "large")
  {
    OrthancPluginLogError(_context, "ToolbarButtonSize invalid value.  Allowed values are \"small\" and \"large\"");
    throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
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

    shortTermCachePath = OrthancPlugins::GetStringValue(configuration, "StorageDirectory", "."); // By default, the cache of the Web viewer is located inside the "StorageDirectory" of Orthanc
    shortTermCachePath /= "WebViewerCache";

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

  config["enableStudyDownload"] = studyDownloadEnabled;
  config["enableVideoDisplay"] = videoDisplayEnabled;
  config["enableAnnotationStorage"] = annotationStorageEnabled;
  config["enableKeyImageCapture"] = keyImageCaptureEnabled;
  config["showStudyInformationBreadcrumb"] = showStudyInformationBreadcrumb;
  config["windowingPresets"] = windowingPresets;
  config["enableHighQualityImagePreloading"] = highQualityImagePreloadingEnabled;
  config["reduceTimelineHeightOnSingleFrameSeries"] = reduceTimelineHeightOnSingleFrameSeries;
  config["showNoReportIconInSeriesList"] = showNoReportIconInSeriesList;
  config["toolbarLayoutMode"] = toolbarLayoutMode;
  config["toolbarButtonSize"] = toolbarButtonSize;

  return config;
}
