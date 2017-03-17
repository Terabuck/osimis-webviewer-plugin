#include "SeriesController.h"

#include <memory>
#include <boost/regex.hpp>
#include <Core/OrthancException.h>

#include "../BenchmarkHelper.h" // for BENCH(*)
#include "../OrthancContextManager.h"


SeriesRepository* SeriesController::seriesRepository_ = NULL;

template<>
void SeriesController::Inject<SeriesRepository>(SeriesRepository* obj) {
  SeriesController::seriesRepository_ = obj;
}

SeriesController::SeriesController(OrthancPluginRestOutput* response, const std::string& url, const OrthancPluginHttpRequest* request)
  : BaseController(response, url, request)
{

}

int SeriesController::_ParseURLPostFix(const std::string& urlPostfix) {
  // /osimis-viewer/series/<series_uid>
  boost::regex regexp("^([^/]+)$");

  // Parse URL
  boost::cmatch matches;
  if (!boost::regex_match(urlPostfix.c_str(), matches, regexp)) {
    // Return 404 error on badly formatted URL - @todo use ErrorCode_UriSyntax instead
    return this->_AnswerError(404);
  }
  else {
    // Store seriesId
    this->seriesId_ = matches[1];

    BENCH_LOG(SERIES_ID, seriesId_);

    return 200;
  }
}

int SeriesController::_ProcessRequest()
{
  BENCH(FULL_PROCESS);
  OrthancPluginContext* context = OrthancContextManager::Get();
  try {
    // Write Log
    std::string message = "Ordering instances of series: " + this->seriesId_;
    OrthancPluginLogInfo(context, message.c_str());
    
    // Load the series with an auto_ptr so it's freed at the end of thit method
    std::auto_ptr<Series> series(seriesRepository_->GetSeries(this->seriesId_));

    // Answer Request with the series' information as JSON
    return this->_AnswerBuffer(series->ToJson(), "application/json");
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