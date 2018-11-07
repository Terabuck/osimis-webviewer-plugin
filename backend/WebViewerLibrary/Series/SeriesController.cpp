#include "SeriesController.h"

#include <memory>
#include <string>
#include <boost/regex.hpp>
#include <boost/lexical_cast.hpp> // to retrieve exception error code for log
#include <Core/OrthancException.h>

#include "../BenchmarkHelper.h" // for BENCH(*)
#include "../OrthancContextManager.h"
#include "Config/WebViewerConfiguration.h"


SeriesRepository* SeriesController::seriesRepository_ = NULL;
const WebViewerConfiguration* SeriesController::_config = NULL;

template<>
void SeriesController::Inject<SeriesRepository>(SeriesRepository* obj) {
  SeriesController::seriesRepository_ = obj;
}

SeriesController::SeriesController(OrthancPluginRestOutput* response, const std::string& url, const OrthancPluginHttpRequest* request)
  : BaseController(response, url, request)
{

}

int SeriesController::_ParseURLPostFix(const std::string& urlPostfix) {
  // Retrieve context so we can use orthanc's logger.
  OrthancPluginContext* context = OrthancContextManager::Get();

  try {
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
  catch (const Orthanc::OrthancException& exc) {
    // Log detailed Orthanc error.
    std::string message("(SeriesController) Orthanc::OrthancException during URL parsing ");
    message += boost::lexical_cast<std::string>(exc.GetErrorCode());
    message += "/";
    message += boost::lexical_cast<std::string>(exc.GetHttpStatus());
    message += " ";
    message += exc.What();
    OrthancPluginLogError(context, message.c_str());

    return this->_AnswerError(exc.GetHttpStatus());
  }
  catch (const std::exception& exc) {
    // Log detailed std error.
    std::string message("(SeriesController) std::exception during URL parsing ");
    message += exc.what();
    OrthancPluginLogError(context, message.c_str());

    return this->_AnswerError(500);
  }
  catch (const std::string& exc) {
    // Log string error (shouldn't happen).
    std::string message("(SeriesController) std::string during URL parsing ");
    message += exc;
    OrthancPluginLogError(context, message.c_str());

    return this->_AnswerError(500);
  }
  catch (...) {
    // Log unknown error (shouldn't happen).
    std::string message("(SeriesController) Unknown Exception during URL parsing");
    OrthancPluginLogError(context, message.c_str());

    return this->_AnswerError(500);
  }
}

int SeriesController::_ProcessRequest()
{
  // Retrieve context so we can use orthanc's logger.
  OrthancPluginContext* context = OrthancContextManager::Get();

  try {
    BENCH(FULL_PROCESS);

    // Write Log
    std::string message = "Ordering instances of series: " + this->seriesId_;
    OrthancPluginLogInfo(context, message.c_str());
    
    // Load the series with an auto_ptr so it's freed at the end of thit method
    std::auto_ptr<Series> series(seriesRepository_->GetSeries(this->seriesId_));
    if (_config->modalitiesToSkip.find(series->GetModality()) != _config->modalitiesToSkip.end()) {

      Json::Value modalitySkippedResponse;
      modalitySkippedResponse["skipped"] = true;
      OrthancPluginLogWarning(context, "skipping series whose Modality is listed in ModalitiesToHide");
      return this->_AnswerBuffer(modalitySkippedResponse);
    }
    Json::Value seriesInfo;
    series->ToJson(seriesInfo);

    // Answer Request with the series' information as JSON
    return this->_AnswerBuffer(seriesInfo.toStyledString(), "application/json");
  }
  // @note if the exception has been thrown from some constructor,
  // memory leaks may happen. we should fix the bug instead of focusing on those memory leaks.
  // however, in case of memory leak due to bad alloc, we should clean memory.
  // @todo avoid memory allocation within constructor
  catch (const Orthanc::OrthancException& exc) {
    // Log detailed Orthanc error.
    std::string message("(SeriesController) Orthanc::OrthancException ");
    message += boost::lexical_cast<std::string>(exc.GetErrorCode());
    message += "/";
    message += boost::lexical_cast<std::string>(exc.GetHttpStatus());
    message += " ";
    message += exc.What();
    OrthancPluginLogError(context, message.c_str());

    return this->_AnswerError(exc.GetHttpStatus());
  }
  catch (const std::exception& exc) {
    // Log detailed std error.
    std::string message("(SeriesController) std::exception ");
    message += exc.what();
    OrthancPluginLogError(context, message.c_str());

    return this->_AnswerError(500);
  }
  catch (const std::string& exc) {
    // Log string error (shouldn't happen).
    std::string message("(SeriesController) std::string ");
    message += exc;
    OrthancPluginLogError(context, message.c_str());

    return this->_AnswerError(500);
  }
  catch (...) {
    // Log unknown error (shouldn't happen).
    std::string message("(SeriesController) Unknown Exception");
    OrthancPluginLogError(context, message.c_str());

    return this->_AnswerError(500);
  }
}
