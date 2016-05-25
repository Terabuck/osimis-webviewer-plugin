#ifndef BASE_ROUTE_H
#define BASE_ROUTE_H

#include <string>
#include <Orthanc/OrthancCPlugin.h>
#include "OrthancContextManager.h"

class BaseController {
public:
  BaseController(OrthancPluginRestOutput* response, const std::string& url, const OrthancPluginHttpRequest* request);
  OrthancPluginErrorCode ProcessRequest();

protected:

  // Called when the route URL isn't postfixed
  virtual OrthancPluginErrorCode _OnEmptyURLPostFix() { return OrthancPluginErrorCode_Success; }

  // Parse the rest of the URL (the relative URL without the path prefix set in RegisterRoute)
  virtual OrthancPluginErrorCode _ParseURLPostFix(const std::string& urlPostfix) { return OrthancPluginErrorCode_Success; }

  // Process the url content
  virtual OrthancPluginErrorCode _ProcessRequest() = 0;

  OrthancPluginErrorCode _AnswerError(int error_code);
  OrthancPluginErrorCode _AnswerBuffer(const std::string& output, const std::string& mimeType);

protected:
  OrthancPluginRestOutput* response_;
  const std::string url_;
  const OrthancPluginHttpRequest* request_;
};

// Convert Route to Orthanc C Callback Format
template<typename CONTROLLER_T>
OrthancPluginErrorCode GetRouteCallback(OrthancPluginRestOutput* response, const char* url, const OrthancPluginHttpRequest* request) {
  CONTROLLER_T controller(response, url, request);

  return controller.ProcessRequest();
}

// Register route within Orthanc
template<typename CONTROLLER_T>
void RegisterRoute(const std::string& path_prefix) {
  std::string path = path_prefix + "?(.*)";

  OrthancPluginRegisterRestCallbackNoLock(OrthancContextManager::Get(), path.c_str(), GetRouteCallback<CONTROLLER_T>);
}

#endif // BASE_ROUTE_H
