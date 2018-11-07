#pragma once

#include <string>
#include <map>
#include <vector>
#include <boost/noncopyable.hpp>

#include "../BaseController.h"

class WebViewerConfiguration;

class CustomCommandController : public BaseController, public boost::noncopyable {
private:
  /**
   * The webviewer configuration.
   *
   * @rationale
   * We can't do it without static since Orthanc API doesn't allow us to pass
   * attributes when processing REST request.
   */
  static const WebViewerConfiguration* _config;


public:
  CustomCommandController(OrthancPluginRestOutput* response, const std::string& url, const OrthancPluginHttpRequest* request);

protected:
  virtual int _OnEmptyURLPostFix() { return 200; }
  virtual int _ParseURLPostFix(const std::string& urlPostfix) { return 200; }
  virtual int _ProcessRequest();

public:
  static void setConfig(const WebViewerConfiguration* config) {_config = config; }

};
