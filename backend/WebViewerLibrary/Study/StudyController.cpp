#include "StudyController.h"

#include <memory>
#include <boost/regex.hpp>
#include <Core/OrthancException.h>

#include "../Annotation/AnnotationRepository.h"
#include "../BenchmarkHelper.h" // for BENCH(*)
#include "../OrthancContextManager.h"


AnnotationRepository* StudyController::annotationRepository_ = NULL;

template<>
void StudyController::Inject<AnnotationRepository>(AnnotationRepository* obj) {
  StudyController::annotationRepository_ = obj;
}

StudyController::StudyController(OrthancPluginRestOutput* response, const std::string& url, const OrthancPluginHttpRequest* request)
  : BaseController(response, url, request)
{

}

int StudyController::_ParseURLPostFix(const std::string& urlPostfix) {
  // /osimis-viewer/studies/<Study_uid>/annotations
  boost::regex regexp("^([^/]+)/annotations$");

  // Parse URL
  boost::cmatch matches;
  if (!boost::regex_match(urlPostfix.c_str(), matches, regexp)) {
    // Return 404 error on badly formatted URL - @todo use ErrorCode_UriSyntax instead
    return this->_AnswerError(404);
  }
  else {
    // Store StudyId
    this->studyId_ = matches[1];

    BENCH_LOG(STUDY_ID, studyId_);

    return 200;
  }
}

int StudyController::_ProcessRequest()
{
  BENCH(FULL_PROCESS);
  OrthancPluginContext* context = OrthancContextManager::Get();
  try {

    // Answer 403 Forbidden if annotation storage is disabled
    if (!this->annotationRepository_->isAnnotationStorageEnabled()) {
      return this->_AnswerError(403);
    }
    // Answer Request with the study's annotations as JSON else
    else {
      Json::Value annotations = annotationRepository_->getByStudyId(this->studyId_);
      return this->_AnswerBuffer(annotations);
    }
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