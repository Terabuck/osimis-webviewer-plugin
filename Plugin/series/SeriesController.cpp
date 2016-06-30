#include <boost/regex.hpp>

#include "SeriesController.h"

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

OrthancPluginErrorCode SeriesController::_ParseURLPostFix(const std::string& urlPostfix) {
  // <series_uid>
  boost::regex regexp("^([^/]+)$");

  // Parse URL
  boost::cmatch matches;
  if (!boost::regex_match(urlPostfix.c_str(), matches, regexp)) {
    // Return 404 error on badly formatted URL
    return this->_AnswerError(404);
  }
  else {
    // Store seriesId
    this->seriesId_ = matches[1];

    BENCH_LOG(SERIES_ID, seriesId_);

    return OrthancPluginErrorCode_Success;
  }
}

OrthancPluginErrorCode SeriesController::_ProcessRequest()
{
  BENCH(FULL_PROCESS);

  // Write Log
  OrthancPluginContext* context = OrthancContextManager::Get();
  std::string message = "Ordering instances of series: " + this->seriesId_;
  OrthancPluginLogInfo(context, message.c_str());
  
  // Load the series with an auto_ptr so it's freed at the end of thit method
  std::auto_ptr<Series> series(seriesRepository_->GetSeries(this->seriesId_));

  // Answer Request with the series' information as JSON
  return this->_AnswerBuffer(series->ToJson(), "application/json");
}