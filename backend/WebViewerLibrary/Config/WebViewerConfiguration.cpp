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

  windowingBehaviour = Json::Value(Json::objectValue);
  windowingBehaviour["left"] = "decrease-ww";
  windowingBehaviour["right"] = "increase-ww";
  windowingBehaviour["up"] = "decrease-wc";
  windowingBehaviour["down"] = "increase-wc";

  combinedToolBehaviour = Json::Value(Json::objectValue);
  combinedToolBehaviour["leftMouseButton"] = "windowing";
  combinedToolBehaviour["middleMouseButton"] = "pan";
  combinedToolBehaviour["rightMouseButton"] = "zoom";
  combinedToolBehaviour["oneTouchPan"] = "windowing";
  combinedToolBehaviour["twoTouchPan"] = "pan";
  combinedToolBehaviour["threeTouchPan"] = Json::nullValue;

  mouseWheelBehaviour["down"] = "previousImage";
  mouseWheelBehaviour["up"] = "nextImage";

  keyboardShortcuts = Json::Value(Json::objectValue);
  keyboardShortcuts["left"] = "previousImage";
  keyboardShortcuts["right"] = "nextImage";
  keyboardShortcuts["up"] = "previousSeries";
  keyboardShortcuts["down"] = "nextSeries";
  keyboardShortcuts["shift + up"] = "previousStudy";
  keyboardShortcuts["shift + down"] = "nextStudy";

  keyboardShortcuts["l"] = "rotateLeft";
  keyboardShortcuts["r"] = "rotateRight";
  keyboardShortcuts["v"] = "flipVertical";
  keyboardShortcuts["h"] = "flipHorizontal";
  keyboardShortcuts["i"] = "invertColor";
  keyboardShortcuts["c"] = "selectCombinedTool";
  keyboardShortcuts["p"] = "selectPanTool";
  keyboardShortcuts["z"] = "selectZoomTool";
  keyboardShortcuts["w"] = "selectWindowingTool";
  keyboardShortcuts["ctrl + l, cmd + l"] = "selectLengthMeasureTool";
  keyboardShortcuts["ctrl + i, cmd + i"] = "selectPixelProbeTool";
  keyboardShortcuts["ctrl + m, cmd + m"] = "selectMagnifyingGlassTool";
  keyboardShortcuts["ctrl + e, cmd + e"] = "selectEllipticalRoiTool";
  keyboardShortcuts["ctrl + o, cmd + o"] = "selectRectangleRoiTool";
  keyboardShortcuts["ctrl + a, cmd + a"] = "selectArrowAnnotateTool";
  keyboardShortcuts["ctrl + k, cmd + k"] = "selectKeyImageCaptureTool";
  keyboardShortcuts["ctrl + p, cmd + p"] = "print";
  keyboardShortcuts["1, num1"] = "applyEmbeddedWindowingPreset1";
  keyboardShortcuts["2, num2"] = "applyEmbeddedWindowingPreset2";
  keyboardShortcuts["3, num3"] = "applyEmbeddedWindowingPreset3";
  keyboardShortcuts["4, num4"] = "applyEmbeddedWindowingPreset4";
  keyboardShortcuts["5, num5"] = "applyEmbeddedWindowingPreset5";
  keyboardShortcuts["ctrl + 1, ctrl + num1, cmd + 1, cmd + num1"] = "applyConfigWindowingPreset1";
  keyboardShortcuts["ctrl + 2, ctrl + num2, cmd + 2, cmd + num2"] = "applyConfigWindowingPreset2";
  keyboardShortcuts["ctrl + 3, ctrl + num3, cmd + 3, cmd + num3"] = "applyConfigWindowingPreset3";
  keyboardShortcuts["ctrl + 4, ctrl + num4, cmd + 4, cmd + num4"] = "applyConfigWindowingPreset4";
  keyboardShortcuts["ctrl + 5, ctrl + num5, cmd + 5, cmd + num5"] = "applyConfigWindowingPreset5";
  keyboardShortcuts["s"] = "toggleSynchro";
  keyboardShortcuts["f1"] = "setLayout1x1";
  keyboardShortcuts["f2"] = "setLayout1x2";
  keyboardShortcuts["f3"] = "setLayout2x1";
  keyboardShortcuts["f4"] = "setLayout2x2";
  keyboardShortcuts["space"] = "playPause";
  keyboardShortcuts["tab"] = "selectNextPane";
  keyboardShortcuts["shift + tab"] = "selectPreviousPane";
  keyboardShortcuts["enter"] = "loadSeriesInPane";

  instanceInfoCacheEnabled = OrthancPlugins::GetBoolValue(wvConfig, "InstanceInfoCacheEnabled", false);
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
    windowingPresets = Json::Value(Json::arrayValue);  // remove default values

    for (Json::Value::ArrayIndex i = 0; i < wvConfig["WindowingPresets"].size(); i++)
    {
      Json::Value preset = wvConfig["WindowingPresets"][i];
      if (preset.type() != Json::objectValue) {
        OrthancPluginLogError(_context, "WindowingPresets invalid value.  It shall be an object.");
        throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
      }
      else
      {
        windowingPresets[i] = Json::Value(Json::objectValue);
        windowingPresets[i]["name"] = preset["Name"];
        windowingPresets[i]["windowCenter"] = preset["WindowCenter"];
        windowingPresets[i]["windowWidth"] = preset["WindowWidth"];
      }
    }
  }

  // Retrieve combinedTool preset (if set).
  if (wvConfig.isMember("CombinedToolBehaviour") &&
      wvConfig["CombinedToolBehaviour"].type() == Json::objectValue)
  {
    combinedToolBehaviour = Json::Value(Json::objectValue);  // remove default values

    Json::Value::Members members = wvConfig["CombinedToolBehaviour"].getMemberNames();

    for (size_t i = 0; i < members.size(); i++) {
      combinedToolBehaviour[members[i].c_str()] = wvConfig["CombinedToolBehaviour"][members[i]];
    }
  }

  // Retrieve windowing (if set).
  if (wvConfig.isMember("WindowingBehaviour") &&
      wvConfig["WindowingBehaviour"].type() == Json::objectValue)
  {
    windowingBehaviour = Json::Value(Json::objectValue);  // remove default values

    Json::Value::Members members = wvConfig["WindowingBehaviour"].getMemberNames();

    for (size_t i = 0; i < members.size(); i++)
    {
      windowingBehaviour[members[i].c_str()] = wvConfig["WindowingBehaviour"][members[i]];
    }
  }

  // Retrieve mouse wheel (if set).
  if (wvConfig.isMember("MouseWheelBehaviour") &&
      wvConfig["MouseWheelBehaviour"].type() == Json::objectValue)
  {
    mouseWheelBehaviour = Json::Value(Json::objectValue);  // remove default values

    Json::Value::Members members = wvConfig["MouseWheelBehaviour"].getMemberNames();

    for (size_t i = 0; i < members.size(); i++)
    {
      mouseWheelBehaviour[members[i].c_str()] = wvConfig["MouseWheelBehaviour"][members[i]];
    }
  }

  // Retrieve keyboardShortcuts (if set).
  if (wvConfig.isMember("KeyboardShortcuts") &&
      wvConfig["KeyboardShortcuts"].type() == Json::objectValue)
  {
    keyboardShortcuts = Json::Value(Json::objectValue);  // remove default values

    Json::Value::Members members = wvConfig["KeyboardShortcuts"].getMemberNames();

    for (size_t i = 0; i < members.size(); i++)
    {
      keyboardShortcuts[members[i].c_str()] = wvConfig["KeyboardShortcuts"][members[i]];
    }
  }

  persistentCachedImageStorageEnabled = OrthancPlugins::GetBoolValue(wvConfig, "CacheEnabled", false);
  studyDownloadEnabled = OrthancPlugins::GetBoolValue(wvConfig, "StudyDownloadEnabled", true);
  keyboardShortcutsEnabled = OrthancPlugins::GetBoolValue(wvConfig, "KeyboardShortcutsEnabled", true);
  videoDisplayEnabled = OrthancPlugins::GetBoolValue(wvConfig, "VideoDisplayEnabled", true);
  annotationStorageEnabled = OrthancPlugins::GetBoolValue(wvConfig, "AnnotationStorageEnabled", false);
  keyImageCaptureEnabled = OrthancPlugins::GetBoolValue(wvConfig, "KeyImageCaptureEnabled", false);
  combinedToolEnabled = OrthancPlugins::GetBoolValue(wvConfig, "CombinedToolEnabled", false);
  printEnabled = OrthancPlugins::GetBoolValue(wvConfig, "PrintEnabled", true);
  openAllPatientStudies = OrthancPlugins::GetBoolValue(wvConfig, "OpenAllPatientStudies", true);
  showStudyInformationBreadcrumb = OrthancPlugins::GetBoolValue(wvConfig, "ShowStudyInformationBreadcrumb", false);
  shortTermCachePrefetchOnInstanceStored = OrthancPlugins::GetBoolValue(wvConfig, "ShortTermCachePrefetchOnInstanceStored", false);
  shortTermCacheEnabled = OrthancPlugins::GetBoolValue(wvConfig, "ShortTermCacheEnabled", false);
  shortTermCacheDebugLogsEnabled = OrthancPlugins::GetBoolValue(wvConfig, "ShortTermCacheDebugLogsEnabled", false);
  shortTermCachePath = OrthancPlugins::GetStringValue(wvConfig, "ShortTermCachePath", shortTermCachePath.string());
  shortTermCacheSize = OrthancPlugins::GetIntegerValue(wvConfig, "ShortTermCacheSize", 1000);
  shortTermCacheDecoderThreadsCound = OrthancPlugins::GetIntegerValue(wvConfig, "Threads", std::max(boost::thread::hardware_concurrency() / 2, 1u));
  highQualityImagePreloadingEnabled = OrthancPlugins::GetBoolValue(wvConfig, "HighQualityImagePreloadingEnabled", true);
  reduceTimelineHeightOnSingleFrameSeries = OrthancPlugins::GetBoolValue(wvConfig, "ReduceTimelineHeightOnSingleFrameSeries", false);
  showNoReportIconInSeriesList = OrthancPlugins::GetBoolValue(wvConfig, "ShowNoReportIconInSeriesList", false);
  toolbarLayoutMode = OrthancPlugins::GetStringValue(wvConfig, "ToolbarLayoutMode", "flat");
  toolbarButtonSize = OrthancPlugins::GetStringValue(wvConfig, "ToolbarButtonSize", "small");
  defaultSelectedTool = OrthancPlugins::GetStringValue(wvConfig, "DefaultSelectedTool", "zoom");
  defaultStudyIslandsDisplayMode = OrthancPlugins::GetStringValue(wvConfig, "DefaultStudyIslandsDisplayMode", "grid");
  defaultLanguage = OrthancPlugins::GetStringValue(wvConfig, "DefaultLanguage", "en");
  customOverlayProviderUrl = OrthancPlugins::GetStringValue(wvConfig, "CustomOverlayProviderUrl", "");  // must be provided as a url relative to orthanc root url (i.e.: "/../customOverlays/")
  toggleOverlayTextButtonEnabled = OrthancPlugins::GetBoolValue(wvConfig, "ToggleOverlayTextButtonEnabled", false);
  toggleOverlayIconsButtonEnabled = OrthancPlugins::GetBoolValue(wvConfig, "ToggleOverlayIconsButtonEnabled", false);
  displayOverlayText = OrthancPlugins::GetBoolValue(wvConfig, "DisplayOverlayText", true);
  displayOverlayIcons = OrthancPlugins::GetBoolValue(wvConfig, "DisplayOverlayIcons", true);


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

  if (defaultStudyIslandsDisplayMode != "grid" && defaultStudyIslandsDisplayMode != "list" && defaultStudyIslandsDisplayMode != "oneCol")
  {
    OrthancPluginLogError(_context, "DefaultStudyIslandsDisplayMode invalid value.  Allowed values are \"grid\" and \"list\" and \"oneCol\"");
    throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
  }

  {// validate combinedToolBehaviour
    std::set<std::string> combinedToolAllowedToolNames = { "windowing", "pan", "zoom" };
    std::set<std::string> combinedToolAllowedActions = { "leftMouseButton", "middleMouseButton", "rightMouseButton", "oneTouchPan", "twoTouchPan", "threeTouchPan"};

    Json::Value::Members members = combinedToolBehaviour.getMemberNames();

    for (size_t i = 0; i < members.size(); i++)
    {
      std::string action = members[i];

      if (combinedToolAllowedActions.find(action) == combinedToolAllowedActions.end()) {
        OrthancPluginLogError(_context, (std::string("CombinedToolBehaviour invalid action: ") + action).c_str());
        throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
      }

      if (!combinedToolBehaviour[action].isNull()) {
        std::string toolName = combinedToolBehaviour[action].asString();
        if (combinedToolAllowedToolNames.find(toolName) == combinedToolAllowedToolNames.end()) {
          OrthancPluginLogError(_context, (std::string("CombinedToolBehaviour invalid toolName: ") + toolName).c_str());
          throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
        }
      }
    }
  }

  {// validate windowingBehaviour
    std::set<std::string> windowingAllowedDirections = { "left", "right", "up", "down" };
    std::set<std::string> windowingAllowedToolNames = { "decrease-ww", "increase-ww", "decrease-wc", "increase-wc"};

    Json::Value::Members members = windowingBehaviour.getMemberNames();

    for (size_t i = 0; i < members.size(); i++)
    {
      std::string direction = members[i];

      if (windowingAllowedDirections.find(direction) == windowingAllowedDirections.end()) {
        OrthancPluginLogError(_context, (std::string("WindowingBehaviour invalid direction: ") + direction).c_str());
        throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
      }

      if (!windowingBehaviour[direction].isNull()) {
        std::string toolName = windowingBehaviour[direction].asString();
        if (windowingAllowedToolNames.find(toolName) == windowingAllowedToolNames.end()) {
          OrthancPluginLogError(_context, (std::string("WindowingBehaviour invalid toolName: ") + toolName).c_str());
          throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
        }
      }
    }
  }

  {// validate keyboard shortcuts
    std::set<std::string> keyboardShortcutsAllowedToolNames = {
      "nextStudy", "previousStudy", "nextSeries", "previousSeries", "nextImage", "previousImage",
      "rotateLeft", "rotateRight", "flipVertical", "flipHorizontal", "invertColor",
      "selectCombinedTool", "selectPanTool", "selectWindowingTool", "selectZoomTool",
      "selectMagnifyingGlassTool", "selectLengthMeasureTool", "selectPixelProbeTool",
      "selectEllipticalRoiTool", "selectRectangleRoiTool", "selectArrowAnnotateTool",
      "selectKeyImageCaptureTool",
      "applyEmbeddedWindowingPreset1", "applyEmbeddedWindowingPreset2", "applyEmbeddedWindowingPreset3",
      "applyEmbeddedWindowingPreset4", "applyEmbeddedWindowingPreset5",
      "applyConfigWindowingPreset1", "applyConfigWindowingPreset2", "applyConfigWindowingPreset3",
      "applyConfigWindowingPreset4", "applyConfigWindowingPreset5",
      "toggleSynchro", "enableSynchro", "disableSynchro",
      "setLayout1x1", "setLayout1x2", "setLayout2x1", "setLayout2x2",
      "play", "pause", "playPause", "selectNextPane", "selectPreviousPane",
      "loadSeriesInPane", "toggleOverlayText", "toggleOverlayIcons",
      "print",
      "null"
    };

    Json::Value::Members members = keyboardShortcuts.getMemberNames();

    for (size_t i = 0; i < members.size(); i++)
    {
      std::string shortcut = members[i];

      if (!keyboardShortcuts[shortcut].isNull()) {
        std::string toolName = keyboardShortcuts[shortcut].asString();

        if (keyboardShortcutsAllowedToolNames.find(toolName) == keyboardShortcutsAllowedToolNames.end()) {
          OrthancPluginLogError(_context, (std::string("KeyboardShortcut invalid toolName: ") + toolName).c_str());
          throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
        }
      }
    }
  }

  {// validate mouse wheel
    std::set<std::string> mouseWheelAllowedDirections = { "up", "down" };
    std::set<std::string> mouseWheelAllowedToolNames = { "nextImage", "previousImage", "zoomIn", "zoomOut"};

    Json::Value::Members members = mouseWheelBehaviour.getMemberNames();

    for (size_t i = 0; i < members.size(); i++)
    {
      std::string direction = members[i];

      if (mouseWheelAllowedDirections.find(direction) == mouseWheelAllowedDirections.end()) {
        OrthancPluginLogError(_context, (std::string("MouseWheelBehaviour invalid direction: ") + direction).c_str());
        throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
      }

      if (!mouseWheelBehaviour[direction].isNull()) {
        std::string toolName = mouseWheelBehaviour[direction].asString();
        if (mouseWheelAllowedToolNames.find(toolName) == mouseWheelAllowedToolNames.end()) {
          OrthancPluginLogError(_context, (std::string("MouseWheelBehaviour invalid toolName: ") + toolName).c_str());
          throw Orthanc::OrthancException(Orthanc::ErrorCode_BadFileFormat);
        }
      }
    }

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
    shortTermCachePath /= "OsimisWebViewerCache";

    static const char* CONFIG_WEB_VIEWER = "WebViewer";
    if (configuration.isMember(CONFIG_WEB_VIEWER)) {
      // Parse the config content using an overridable method.
      _parseFile(configuration[CONFIG_WEB_VIEWER]);
    } else {
      _parseFile(Json::objectValue);
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

  config["keyboardShortcutsEnabled"] = keyboardShortcutsEnabled;
  config["studyDownloadEnabled"] = studyDownloadEnabled;
  config["videoDisplayEnabled"] = videoDisplayEnabled;
  config["annotationStorageEnabled"] = annotationStorageEnabled;
  config["keyImageCaptureEnabled"] = keyImageCaptureEnabled;
  config["combinedToolEnabled"] = combinedToolEnabled;
  config["printEnabled"] = printEnabled;
  config["openAllPatientStudies"] = openAllPatientStudies;
  config["showStudyInformationBreadcrumb"] = showStudyInformationBreadcrumb;
  config["windowingPresets"] = windowingPresets;
  config["combinedToolBehaviour"] = combinedToolBehaviour;
  config["windowingBehaviour"] = windowingBehaviour;
  config["mouseWheelBehaviour"] = mouseWheelBehaviour;
  config["keyboardShortcuts"] = keyboardShortcuts;
  config["highQualityImagePreloadingEnabled"] = highQualityImagePreloadingEnabled;
  config["reduceTimelineHeightOnSingleFrameSeries"] = reduceTimelineHeightOnSingleFrameSeries;
  config["showNoReportIconInSeriesList"] = showNoReportIconInSeriesList;
  config["toolbarLayoutMode"] = toolbarLayoutMode;
  config["toolbarButtonSize"] = toolbarButtonSize;
  config["defaultSelectedTool"] = defaultSelectedTool;
  config["defaultStudyIslandsDisplayMode"] = defaultStudyIslandsDisplayMode;
  config["defaultLanguage"] = defaultLanguage;
  config["toggleOverlayTextButtonEnabled"] = toggleOverlayTextButtonEnabled;
  config["toggleOverlayIconsButtonEnabled"] = toggleOverlayIconsButtonEnabled;
  config["displayOverlayText"] = displayOverlayText;
  config["displayOverlayIcons"] = displayOverlayIcons;

  if (customOverlayProviderUrl.length() > 0) {
    config["customOverlayProviderUrl"] = customOverlayProviderUrl;
  }

  return config;
}
