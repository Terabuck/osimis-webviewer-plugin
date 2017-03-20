#pragma once

/**
 * The `WebViewerConfiguration` class contains both for frontend
 * and backend web viewer options.
 *
 * @Rationale
 * Backend options can be used to set specific backend behaviors, for instance activating
 * disk-based cache. They should be kept to a minimum to avoid testing overhead.
 * 
 * Frontend options are necessary to enable/disable/configure frontend features from the
 * backend configuration file.
 * For instance, in the webviewerpro, the liveshare server HOST and PORT used in frontend can be
 * set in the json configuration file instead of having to rebuild the whole javascript.
 * 
 * Using two class for frontend and backend options instead of a single one would implies additional 
 * unnecessary layer of complexity since these classes must be extended or overriden by the webviewerpro.
 */

#include <string>
#include <set>
#include <orthanc/OrthancCPlugin.h>
#include <json/value.h>

// copiable
class WebViewerConfiguration
{
private:
  OrthancPluginContext* _context;

protected:
  /**
   * Register the configuration options within this class, using config file content.
   * This method is extended in webviewerpro.
   *
   * @param Json::Value `config` contains the content of the "WebViewer" key retrieved from
   *                    the orthanc configuration file.
   */
  virtual void _parseFile(const Json::Value& wvConfig);

public:
  bool cachedImageStorageEnabled;

  bool gdcmEnabled;
  bool restrictTransferSyntaxes;
  std::set<std::string> enabledTransferSyntaxes;

  // Frontend Variables
  bool studyDownloadEnabled;
  bool annotationStorageEnabled;

  WebViewerConfiguration(OrthancPluginContext* context) : _context(context) {
    // By default, disable storage attachment cache 
    cachedImageStorageEnabled = false;

    // By default, use GDCM
    gdcmEnabled = true;
    // By default, use GDCM for everything
    restrictTransferSyntaxes = false;

    // By default, show the study download button in the frontend
    studyDownloadEnabled = true;

    // By default, disable annotation storage
    annotationStorageEnabled = false;
  }

  /**
   * Retrieve a specific set of options for the frontend.
   * This only return the version at the moment, but is inherited in wvp.
   *
   * @rationale
   * The goal is to avoid having secure-sensitive options available from the frontend while letting
   * the webviewerpro easily inherit this class to add additional options.
   *
   * @return Json::Value The webviewer configuration (includes current versions)
   *     ```json
   *     {
   *       "version": {
   *         "orthanc": x.x.x,
   *         "webviewer": x.x.x,
   *         "db": x.x.x
   *       },
   *       "enableStudyDownload": true,
   *       "enableAnnotationStorage": false
   *     }
   *     ```
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
