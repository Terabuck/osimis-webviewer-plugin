#ifndef BASE_ROUTE_H
#define BASE_ROUTE_H

#include <string>
#include "Orthanc/OrthancCPlugin.h"
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

// extern "C" {
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

// }

// OrthancPluginErrorCode ServeRoute(OrthancPluginRestOutput* output,
//                                        const char* url,
//                                        const OrthancPluginHttpRequest* request)
// {
//   try
//   {
//     if (request->method != OrthancPluginHttpMethod_Get)
//     {
//       OrthancPluginSendMethodNotAllowed(context_, output, "GET");
//       return OrthancPluginErrorCode_Success;
//     }

//     const std::string id = request->groups[0];
//     std::string content;

//     std::string message = "Processing GET request: " + std::string(url);
//     OrthancPluginLogInfo(context_, message.c_str());

//     TFactory* factory = new TFactory(context_);
//     if (factory->Create(content, id)) {
//         std::string message = "Answering GET request: " + std::string(url);
//         OrthancPluginLogInfo(context_, message.c_str());

//         OrthancPluginAnswerBuffer(context_, output, content.c_str(), content.size(), "application/octet-stream");
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

#endif // BASE_ROUTE_H
