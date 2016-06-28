#include <boost/regex.hpp>

#include "../BenchmarkHelper.h" // for BENCH(*)

#include "InstanceController.h"

DicomRepository* InstanceController::dicomRepository_ = NULL;

template<>
void InstanceController::Inject<DicomRepository>(DicomRepository* obj) {
  InstanceController::dicomRepository_ = obj;
}

InstanceController::InstanceController(OrthancPluginRestOutput* response, const std::string& url, const OrthancPluginHttpRequest* request)
  : BaseController(response, url, request)
{

}

OrthancPluginErrorCode InstanceController::_ParseURLPostFix(const std::string& urlPostfix) {
  // <instance_uid>
  boost::regex regexp("^([^/]+)$");

  boost::cmatch matches;
  if (!boost::regex_match(urlPostfix.c_str(), matches, regexp)) {
    return this->_AnswerError(404);
  }
  else {
    this->instanceId_ = matches[1];

    BENCH_LOG(INSTANCE, instanceId_);

    return this->_AnswerError(505);
  }
}

OrthancPluginErrorCode InstanceController::_ProcessRequest()
{
  BENCH(FULL_PROCESS);

}