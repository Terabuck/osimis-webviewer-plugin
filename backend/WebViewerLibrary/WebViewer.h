#pragma once

#include <string>
#include <boost/noncopyable.hpp>
#include <orthanc/OrthancCPlugin.h>
#include <memory> // for std::auto_ptr

class DicomRepository;
class ImageRepository;
class SeriesRepository;
class WebViewerConfiguration;

class WebViewer : public boost::noncopyable
{
private:
  OrthancPluginContext* _context;
  DicomRepository* _dicomRepository;
  ImageRepository* _imageRepository;
  SeriesRepository* _seriesRepository;

  // Serve front-end folder
  void _serveFrontEnd();

  // Check orthanc version
  bool _isOrthancCompatible();

protected:
  std::auto_ptr<WebViewerConfiguration> _config;

  /**
   * Set the configuration, used to fill the `_config` instance variable.
   * 
   * This method is virtual and can be overriden to provide inherited version of
   * the WebViewerConfiguration. It should call WebViewerConfiguration#parseFile.
   *
   * @return {std::auto_ptr<WebViewerConfiguration>} The configuration object
   */
  virtual std::auto_ptr<WebViewerConfiguration> _createConfig();

  // Serve back-end routes
  virtual void _serveBackEnd();

  // Extend orthanc front end with custom javascript (ie. additionals "Web Viewer" buttons)
  virtual void _plugToOrthancFrontEnd();

public:
  WebViewer(OrthancPluginContext* context);
  virtual ~WebViewer();

  /**
   * Init the webviewer.
   * Should be called by the OrthancPluginInitialize function.
   * 
   * @return {int32_t} The error code returned to the OrthancPluginInitialize function (0 for success, -1 for error).
   */
  int32_t start();

  virtual std::string getName() const;
  virtual std::string getVersion() const;
  WebViewerConfiguration getConfiguration() const;
};
