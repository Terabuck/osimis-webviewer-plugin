#include <boost/regex.hpp>
#include <boost/lexical_cast.hpp>
#include <boost/algorithm/string.hpp> // for boost::split
#include <boost/thread/mutex.hpp>
#include <boost/thread/lock_guard.hpp> 

#include "../BenchmarkHelper.h" // for BENCH(*)
#include "ImageProcessingPolicy/CompositePolicy.h"
#include "ImageProcessingPolicy/JpegConversionPolicy.h"
#include "ImageProcessingPolicy/Uint8ConversionPolicy.h"
#include "ImageProcessingPolicy/KLVEmbeddingPolicy.h"

#include "ImageController.h"
#include <iostream>
ImageRepository* ImageController::imageRepository_ = 0;

template<>
void ImageController::Inject<ImageRepository>(ImageRepository* obj) {
  ImageController::imageRepository_ = obj;
}

ImageController::ImageController(OrthancPluginRestOutput* response, const std::string& url, const OrthancPluginHttpRequest* request)
  : BaseController(response, url, request), frameIndex_(0), imageProcessingRouteParser_()
{
  // Register sub routes

  imageProcessingRouteParser_.RegisterRoute<CompositePolicy>("^(.+/.+)$"); // regex: at least a single "/"
  imageProcessingRouteParser_.RegisterRoute<JpegConversionPolicy>("^jpeg:?(\\d{0,3})$"); // regex: jpeg:<compression rate: int[0;100]>
  imageProcessingRouteParser_.RegisterRoute<Uint8ConversionPolicy>("^8bit$");
  imageProcessingRouteParser_.RegisterRoute<KLVEmbeddingPolicy>("^klv$");
}

OrthancPluginErrorCode ImageController::_ParseURLPostFix(const std::string& urlPostfix) {
  BENCH(URL_PARSING);
  // <instance_uid>/<frame_index>/<processing-policy>
  boost::regex regexp("^(nocache/)?([^/]+)/(\\d+)(?:/(.+))?$");

  boost::cmatch matches;
  if (!boost::regex_match(urlPostfix.c_str(), matches, regexp)) {
    return this->_AnswerError(404);
  }
  else {
    try {
      this->disableCache_ = (std::string(matches[1]) == "nocache/");
      this->instanceId_ = matches[2];
      this->frameIndex_ = boost::lexical_cast<uint32_t>(matches[3]);
      this->processingPolicy_ = matches.size() < 4 ? 0 : imageProcessingRouteParser_.InstantiatePolicyFromRoute(matches[4]);

      BENCH_LOG(INSTANCE, instanceId_);
      BENCH_LOG(FRAME_INDEX, frameIndex_);
    }
    catch (const boost::bad_lexical_cast&) {
      // should be prevented by the regex
      return this->_AnswerError(500);
    }
    catch (...) {
      // @todo better control
      return this->_AnswerError(500);
    }

  }

  return OrthancPluginErrorCode_Success;
}

OrthancPluginErrorCode ImageController::_ProcessRequest()
{
  BENCH(FULL_PROCESS);

  // retrieve processed image
  Image* image = 0;
  if (!this->processingPolicy_) {
    image = imageRepository_->GetImage(this->instanceId_, this->frameIndex_, !this->disableCache_);
  }
  else {
    image = imageRepository_->GetImage(this->instanceId_, this->frameIndex_, this->processingPolicy_, !this->disableCache_);
  }
  
  if (image)
  {
    BENCH(REQUEST_ANSWERING);

    // answer rest request
    OrthancPluginAnswerBuffer(OrthancContextManager::Get(), this->response_, image->GetBinary(), image->GetBinarySize(), "application/octet-stream");

    delete image;
  }
  else
  {
    return OrthancPluginErrorCode_InternalError;
  }

  return OrthancPluginErrorCode_Success;
}


// Parse JpegConversionPolicy compression parameter from its route regex matches
template<>
inline JpegConversionPolicy* ImageProcessingRouteParser::_Instanciate<JpegConversionPolicy>(boost::cmatch& regexpMatches)
{
  int compression = 100;
  
  if (regexpMatches[1].length()) {
    // @todo catch lexical_cast
    compression = boost::lexical_cast<int>(regexpMatches[1]);
  }

  return new JpegConversionPolicy(compression);
};

// Parse a route containing multiple policies into a single CompositePolicy
template<>
inline CompositePolicy* ImageProcessingRouteParser::_Instanciate<CompositePolicy>(boost::cmatch& regexpMatches)
{
  ImageProcessingRouteParser imageProcessingRouteParser;
  imageProcessingRouteParser.RegisterRoute<JpegConversionPolicy>("^jpeg:?(\\d{0,3})$");
  imageProcessingRouteParser.RegisterRoute<Uint8ConversionPolicy>("^8bit$");
  imageProcessingRouteParser.RegisterRoute<KLVEmbeddingPolicy>("^klv$");

  CompositePolicy* compositePolicy = new CompositePolicy();

  std::string policiesStr(regexpMatches[1]);
  std::vector<std::string> policiesStrs;
  boost::algorithm::split(policiesStrs, policiesStr, boost::is_any_of("/"));

  BOOST_FOREACH(const std::string& policyStr, policiesStrs)
  {
    IImageProcessingPolicy* policy = imageProcessingRouteParser.InstantiatePolicyFromRoute(policyStr);
    compositePolicy->AddPolicy(policy);
  }

  return compositePolicy;
};
