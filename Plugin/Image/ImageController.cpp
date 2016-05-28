#include <boost/regex.hpp>
#include <boost/lexical_cast.hpp>
#include <boost/algorithm/string.hpp> // for boost::split

#include "../BenchmarkHelper.h" // for BENCH(*)
#include "ImageProcessingPolicy/CompositePolicy.h"
#include "ImageProcessingPolicy/ResizePolicy.h"
#include "ImageProcessingPolicy/JpegConversionPolicy.h"
#include "ImageProcessingPolicy/PngConversionPolicy.h"
#include "ImageProcessingPolicy/Uint8ConversionPolicy.h"
#include "ImageProcessingPolicy/KLVEmbeddingPolicy.h"

#include "ImageController.h"
#include <iostream>
ImageRepository* ImageController::imageRepository_ = NULL;

template<>
void ImageController::Inject<ImageRepository>(ImageRepository* obj) {
  ImageController::imageRepository_ = obj;
}

ImageController::ImageController(OrthancPluginRestOutput* response, const std::string& url, const OrthancPluginHttpRequest* request)
  : BaseController(response, url, request), frameIndex_(0), imageProcessingRouteParser_()
{
  // Register sub routes

  imageProcessingRouteParser_.RegisterRoute<CompositePolicy>("^(.+/.+)$"); // regex: at least a single "/"
  imageProcessingRouteParser_.RegisterRoute<ResizePolicy>("^resize:(\\d+)$"); // resize:<maximal height/width: uint>
  imageProcessingRouteParser_.RegisterRoute<JpegConversionPolicy>("^jpeg:?(\\d{0,3})$"); // regex: jpeg:<compression rate: int[0;100]>
  imageProcessingRouteParser_.RegisterRoute<PngConversionPolicy>("^png$");
  imageProcessingRouteParser_.RegisterRoute<Uint8ConversionPolicy>("^8bit$");
  imageProcessingRouteParser_.RegisterRoute<KLVEmbeddingPolicy>("^klv$");
}

OrthancPluginErrorCode ImageController::_ParseURLPostFix(const std::string& urlPostfix) {
  BENCH(URL_PARSING);
  // <instance_uid>/<frame_index>/<processing-policy>
  boost::regex regexp("^(nocache/|cleancache/)?([^/]+)/(\\d+)(?:/(.+))?$");

  boost::cmatch matches;
  if (!boost::regex_match(urlPostfix.c_str(), matches, regexp)) {
    return this->_AnswerError(404);
  }
  else {
    try {
      this->disableCache_ = (std::string(matches[1]) == "nocache/");
      this->cleanCache_ = (std::string(matches[1]) == "cleancache/");
      this->instanceId_ = matches[2];
      this->frameIndex_ = boost::lexical_cast<uint32_t>(matches[3]);
      this->processingPolicy_.reset(matches.size() < 4 ? NULL : imageProcessingRouteParser_.InstantiatePolicyFromRoute(matches[4]));

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

  try {
    // clean cache
    if (cleanCache_) {
      imageRepository_->CleanImageCache(this->instanceId_, this->frameIndex_, this->processingPolicy_.get());
      std::string answer = "{}";
      OrthancPluginAnswerBuffer(OrthancContextManager::Get(), this->response_, answer.c_str(), answer.size(), "application/octet-stream");
      return OrthancPluginErrorCode_Success;
    }

    // retrieve processed image
    std::auto_ptr<Image> image;
    if (this->processingPolicy_.get() == NULL) {
      image.reset(imageRepository_->GetImage(this->instanceId_, this->frameIndex_, !this->disableCache_));
    }
    else {
      image.reset(imageRepository_->GetImage(this->instanceId_, this->frameIndex_, this->processingPolicy_.get(), !this->disableCache_));
    }
    
    if (image.get() != NULL)
    {
      BENCH(REQUEST_ANSWERING);

      // answer rest request
      OrthancPluginAnswerBuffer(OrthancContextManager::Get(), this->response_, image->GetBinary(), image->GetBinarySize(), "application/octet-stream");
    }
    else
    {
      return OrthancPluginErrorCode_InternalError;
    }

    return OrthancPluginErrorCode_Success;
  }
  catch (...) {
    return this->_AnswerError(500);
  }
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

// Parse ResizePolicy compression parameter from its route regex matches
template<>
inline ResizePolicy* ImageProcessingRouteParser::_Instanciate<ResizePolicy>(boost::cmatch& regexpMatches)
{
  unsigned int maxWidthHeight = 0;
  
  if (regexpMatches[1].length()) {
    // @todo catch lexical_cast
    maxWidthHeight = boost::lexical_cast<unsigned int>(regexpMatches[1]);
  }

  return new ResizePolicy(maxWidthHeight);
};

// Parse a route containing multiple policies into a single CompositePolicy
template<>
inline CompositePolicy* ImageProcessingRouteParser::_Instanciate<CompositePolicy>(boost::cmatch& regexpMatches)
{
  ImageProcessingRouteParser imageProcessingRouteParser;
  imageProcessingRouteParser.RegisterRoute<ResizePolicy>("^resize:(\\d+)$"); // resize:<maximal height/width: uint>
  imageProcessingRouteParser.RegisterRoute<JpegConversionPolicy>("^jpeg:?(\\d{0,3})$");
  imageProcessingRouteParser.RegisterRoute<PngConversionPolicy>("^png$");
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
