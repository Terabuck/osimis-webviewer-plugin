#include "BaseController.h"
#include "OrthancContextManager.h"

BaseController::BaseController(OrthancPluginRestOutput* response, const std::string& url, const OrthancPluginHttpRequest* request)
  : response_(response), url_(url), request_(request)
{
}

OrthancPluginErrorCode BaseController::ProcessRequest() {
  // parse the URL
  if (this->request_->groupsCount == 0) {
    OrthancPluginErrorCode error = this->_OnEmptyURLPostFix();
    if (error != OrthancPluginErrorCode_Success) {
      return error;
    }
  }
  else if (this->request_->groupsCount == 1) {
    OrthancPluginErrorCode error = this->_ParseURLPostFix(this->request_->groups[0]);
    if (error != OrthancPluginErrorCode_Success) {
      return error;
    }
  }
  else {
    // should not happen
    return OrthancPluginErrorCode_ParameterOutOfRange;
  }

  // process the data
  return this->_ProcessRequest();
}

OrthancPluginErrorCode BaseController::_AnswerError(int error_code) {
  OrthancPluginSendHttpStatusCode(OrthancContextManager::Get(), response_, error_code);
  return OrthancPluginErrorCode_Success;
}
OrthancPluginErrorCode BaseController::_AnswerBuffer(const std::string& output, const std::string& mimeType) {
  OrthancPluginAnswerBuffer(OrthancContextManager::Get(), response_, output.c_str(), output.size(), mimeType.c_str());
  return OrthancPluginErrorCode_Success;
}
