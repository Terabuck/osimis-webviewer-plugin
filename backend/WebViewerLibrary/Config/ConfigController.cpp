#include "ConfigController.h"

#include <assert.h>
#include <json/Value.h>
#include <Core/OrthancException.h>

#include "../OrthancContextManager.h"
#include "WebViewerConfiguration.h"

const WebViewerConfiguration* ConfigController::_config = NULL;

ConfigController::ConfigController(OrthancPluginRestOutput* response, const std::string& url, const OrthancPluginHttpRequest* request)
  : BaseController(response, url, request)
{

}

void ConfigController::setConfig(const WebViewerConfiguration* config) {
  _config = config;
}

int ConfigController::_ParseURLPostFix(const std::string& urlPostfix) {
  // /osimis-viewer/config

  // There is no additional parameter to parse, so we can just return success
  return 200;
}

int ConfigController::_ProcessRequest()
{
  assert(_config != NULL);

  OrthancPluginContext* context = OrthancContextManager::Get();
  try {
    // Write Log
    std::string message = "Retrieving configuration from frontend";
    OrthancPluginLogInfo(context, message.c_str());

    // Retrieve the frontend related config
    Json::Value frontendConfig = _config->getFrontendConfig();

    // Answer Request with frontend config as JSON
    return this->_AnswerBuffer(frontendConfig.toStyledString(), "application/json");
  }
  catch (const Orthanc::OrthancException& exc) {
    OrthancPluginLogInfo(context, exc.What());
    return this->_AnswerError(exc.GetHttpStatus());
  }
  catch (const std::exception& exc) {
    OrthancPluginLogInfo(context, exc.what());
    return this->_AnswerError(500);
  }
  catch (...) {
    // @note if the exception has been thrown from some constructor,
    // memory leaks may happen. we should fix the bug instead of focusing on those memory leaks.
    // however, in case of memory leak due to bad alloc, we should clean memory.
    // @todo avoid memory allocation within constructor

    return this->_AnswerError(500);
  }
}