#pragma once

/**
 * The `WebViewerConfiguration` class contains both for frontend
 * and backend web viewer options.
 *
 * @Rationale Backend options can be used to set specific backend behaviors,
 * for instance activating disk-based cache. They should be kept to a minimum
 * to avoid testing overhead.
 * 
 * Frontend options are necessary to enable/disable/configure frontend features
 * from the backend configuration file. For instance, in the webviewerpro, the
 * liveshare server HOST and PORT used in frontend can be set in the json
 * configuration file instead of having to rebuild the whole javascript.
 * 
 * Using two class for frontend and backend options instead of a single one
 * would implies additional unnecessary layer of complexity since these classes
 * must be extended or overriden by the webviewerpro.
 */

#include <string>
#include <set>
#include <orthanc/OrthancCPlugin.h>
#include <json/value.h>

// copiable
class WebViewerConfiguration
{
protected:
  OrthancPluginContext* _context;

  /**
   * Register the configuration options within this class, using config file
   * content. This method is extended in webviewerpro.
   *
   * @param Json::Value config
   * Contains the content of the "WebViewer" key retrieved from the orthanc
   * configuration file.
   */
  virtual void _parseFile(const Json::Value& wvConfig);

public:
  bool cachedImageStorageEnabled;

  bool gdcmEnabled;
  bool restrictTransferSyntaxes;
  std::set<std::string> enabledTransferSyntaxes;

  // Frontend Variables
  bool studyDownloadEnabled;
  bool videoDisplayEnabled;
  bool annotationStorageEnabled;
  Json::Value windowingPresets;

  WebViewerConfiguration(OrthancPluginContext* context) : _context(context) {
    // By default, disable storage attachment cache.
    cachedImageStorageEnabled = false;

    // By default, use GDCM.
    gdcmEnabled = true;
    // By default, use GDCM for everything.
    restrictTransferSyntaxes = false;

    // By default, show the study download button in the frontend.
    studyDownloadEnabled = true;

    // By default, display DICOM video in the frontend.
    videoDisplayEnabled = true;

    // By default, disable annotation storage.
    annotationStorageEnabled = false;

    // By default, disable annotation storage.
    annotationStorageEnabled = false;

    // By default, set these presets.
    windowingPresets = Json::Value(Json::arrayValue);
    windowingPresets.append(Json::Value(Json::arrayValue));
    windowingPresets[0] = Json::Value(Json::objectValue);
    windowingPresets[0]["name"] = "Ct Lung";
    windowingPresets[0]["windowWidth"] = -400;
    windowingPresets[0]["windowCenter"] = 1600;
    windowingPresets[1] = Json::Value(Json::objectValue);
    windowingPresets[1]["name"] = "Ct Abdomen";
    windowingPresets[1]["windowWidth"] = 300;
    windowingPresets[1]["windowCenter"] = 1500;
    windowingPresets[2] = Json::Value(Json::objectValue);
    windowingPresets[2]["name"] = "Ct Bone";
    windowingPresets[2]["windowWidth"] = 40;
    windowingPresets[2]["windowCenter"] = 80;
    windowingPresets[3] = Json::Value(Json::objectValue);
    windowingPresets[3]["name"] = "Ct Brain";
    windowingPresets[3]["windowWidth"] = 40;
    windowingPresets[3]["windowCenter"] = 400;
    windowingPresets[4] = Json::Value(Json::objectValue);
    windowingPresets[4]["name"] = "Ct Chest";
    windowingPresets[4]["windowWidth"] = -400;
    windowingPresets[4]["windowCenter"] = 1600;
    windowingPresets[5] = Json::Value(Json::objectValue);
    windowingPresets[5]["name"] = "Ct Angio";
    windowingPresets[5]["windowWidth"] = 300;
    windowingPresets[5]["windowCenter"] = 600;
  }
 
  /**
   * Retrieve a specific set of options for the frontend.
   * This only return the version at the moment, but is inherited in wvp.
   *
   * @rationale
   * The goal is to avoid having secure-sensitive options available from the
   * frontend while letting the webviewerpro easily inherit this class to add
   * additional options.
   *
   * @return
   * Json::Value The webviewer configuration (includes current versions).
   * ```json
   * {
   *   "version": {
   *     "orthanc": x.x.x,
   *     "webviewer": x.x.x,
   *     "db": x.x.x
   *   },
   *   "enableStudyDownload": true,
   *   "enableVideoDisplay": true
   *   "enableAnnotationStorage": false,
   *   "windowingPresets": [{
   *     "name": "Ct Lung",
   *     "windowWidth": -400,
   *     "windowCenter": 1600
   *   }, {
   *     "name": "Ct Abdomen",
   *     "windowWidth": 300,
   *     "windowCenter": 1500
   *   }, {
   *     "name": "Ct Bone",
   *     "windowWidth": 40,
   *     "windowCenter": 80
   *   }, {
   *     "name": "Ct Brain",
   *     "windowWidth": 40,
   *     "windowCenter": 400
   *   }, {
   *     "name": "Ct Chest",
   *     "windowWidth": -400,
   *     "windowCenter": 1600
   *   }, {
   *     "name": "Ct Angio",
   *     "windowWidth": 300,
   *     "windowCenter": 600
   *   }]
   * }
   * ```
   */
  virtual Json::Value getFrontendConfig() const;

  /**
   * Load the configuration file and register configuration values using the
   * _parseFile method.
   */
  void parseFile();

  // Class can be inherited
  virtual ~WebViewerConfiguration() {}
};
