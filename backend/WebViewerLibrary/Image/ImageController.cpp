#include <boost/regex.hpp>
#include <boost/foreach.hpp>
#include <boost/lexical_cast.hpp>
#include <boost/algorithm/string.hpp> // for boost::algorithm::split

#include <Core/OrthancException.h> // for OrthancException(UnknownResource) catch

#include "../BenchmarkHelper.h" // for BENCH(*)
#include "ImageProcessingPolicy/LowQualityPolicy.h"
#include "ImageProcessingPolicy/MediumQualityPolicy.h"
#include "ImageProcessingPolicy/HighQualityPolicy.h"
#include "ImageProcessingPolicy/PixelDataQualityPolicy.h"

#if PLUGIN_ENABLE_DEBUG_ROUTE == 1
#include "ImageProcessingPolicy/CompositePolicy.h"
#include "ImageProcessingPolicy/ResizePolicy.h"
#include "ImageProcessingPolicy/JpegConversionPolicy.h"
#include "ImageProcessingPolicy/PngConversionPolicy.h"
#include "ImageProcessingPolicy/Uint8ConversionPolicy.h"
#include "ImageProcessingPolicy/KLVEmbeddingPolicy.h"
#endif // PLUGIN_ENABLE_DEBUG_ROUTE == 1

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

  imageProcessingRouteParser_.RegisterRoute<LowQualityPolicy>("^low-quality$");
  imageProcessingRouteParser_.RegisterRoute<MediumQualityPolicy>("^medium-quality$");
  imageProcessingRouteParser_.RegisterRoute<HighQualityPolicy>("^high-quality$");
  imageProcessingRouteParser_.RegisterRoute<PixelDataQualityPolicy>("^pixeldata-quality$");

#if PLUGIN_ENABLE_DEBUG_ROUTE == 1
  imageProcessingRouteParser_.RegisterRoute<CompositePolicy>("^(.+/.+)$"); // regex: at least a single "/"
  imageProcessingRouteParser_.RegisterRoute<ResizePolicy>("^resize:(\\d+)$"); // resize:<maximal height/width: uint>
  imageProcessingRouteParser_.RegisterRoute<JpegConversionPolicy>("^jpeg:?(\\d{0,3})$"); // regex: jpeg:<compression rate: int[0;100]>
  imageProcessingRouteParser_.RegisterRoute<PngConversionPolicy>("^png$");
  imageProcessingRouteParser_.RegisterRoute<Uint8ConversionPolicy>("^8bit$");
  imageProcessingRouteParser_.RegisterRoute<KLVEmbeddingPolicy>("^klv$");
#endif // PLUGIN_ENABLE_DEBUG_ROUTE
}

int ImageController::_ParseURLPostFix(const std::string& urlPostfix) {
  BENCH(URL_PARSING);
  // /osimis-viewer/images/<instance_uid:str>/<frame_index:int>/{low|medium|high|pixeldata}-quality
  boost::regex regexp("^(nocache/|cleancache/)?([^/]+)/(\\d+)(?:/(.+))$");

  boost::cmatch matches;
  if (!boost::regex_match(urlPostfix.c_str(), matches, regexp)) {
    std::cerr << "BAD REGEX";

    // Return 404 error on badly formatted URL - @todo use ErrorCode_UriSyntax instead
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
    catch (const std::invalid_argument& exc) {
      std::cerr << exc.what();

      // probably because processingPolicy has not been found
      return this->_AnswerError(404);
    }
    catch (const boost::bad_lexical_cast& exc) {
      std::cerr << exc.what();

      // should be prevented by the regex
      return this->_AnswerError(500);
    }
    catch (const Orthanc::OrthancException& exc) {
      std::cerr << exc.What();

      return this->_AnswerError(exc.GetHttpStatus());
    }
    catch (const std::exception& exc) {
      std::cerr << exc.what();
      // @note if the exception has been thrown from some constructor,
      // memory leaks may happen. we should fix the bug instead of focusing on those memory leaks.
      // however, in case of memory leak due to bad alloc, we should clean memory.
      // @todo avoid memory allocation within constructor

      // @todo better control
      return this->_AnswerError(500);
    }

  }

  return 200;
}

int ImageController::_ProcessRequest()
{
  BENCH(FULL_PROCESS);

  try {
    // clean cache
    if (cleanCache_) {
      imageRepository_->CleanImageCache(this->instanceId_, this->frameIndex_, this->processingPolicy_.get());
      std::string answer = "{}";
      return this->_AnswerBuffer(answer, "application/json");
    }

    // all routes point to a processing policy, check there is one
    assert(this->processingPolicy_.get() != NULL);

    // retrieve processed image
    std::auto_ptr<Image> image = imageRepository_->GetImage(this->instanceId_, this->frameIndex_, this->processingPolicy_.get(), !this->disableCache_);
    
    if (image.get() != NULL)
    {
      BENCH(REQUEST_ANSWERING);

      // Answer rest request
      return this->_AnswerBuffer(image->GetBinary(), image->GetBinarySize(), "application/octet-stream");
    }
    else
    {
      // Answer Internal Error
      return this->_AnswerError(500);
    }
  }
  catch (const Orthanc::OrthancException& exc) {
    return this->_AnswerError(exc.GetHttpStatus());
  }
  catch (const std::exception& exc) {
    std::cerr << exc.what();
    return this->_AnswerError(500);
  }
}

#if PLUGIN_ENABLE_DEBUG_ROUTE == 1
// Parse JpegConversionPolicy compression parameter from its route regex matches
// may throws lexical_cast on bad route
template<>
inline JpegConversionPolicy* ImageProcessingRouteParser::_Instantiate<JpegConversionPolicy>(boost::cmatch& regexpMatches)
{
  int compression = 100;
  
  if (regexpMatches[1].length()) {
    compression = boost::lexical_cast<int>(regexpMatches[1]);
  }

  return new JpegConversionPolicy(compression);
};

// Parse ResizePolicy compression parameter from its route regex matches
// may throws lexical_cast on bad route
template<>
inline ResizePolicy* ImageProcessingRouteParser::_Instantiate<ResizePolicy>(boost::cmatch& regexpMatches)
{
  unsigned int maxWidthHeight = 0;
  
  if (regexpMatches[1].length()) {
    maxWidthHeight = boost::lexical_cast<unsigned int>(regexpMatches[1]);
  }

  return new ResizePolicy(maxWidthHeight);
};

// Parse a route containing multiple policies into a single CompositePolicy
template<>
inline CompositePolicy* ImageProcessingRouteParser::_Instantiate<CompositePolicy>(boost::cmatch& regexpMatches)
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
#endif // PLUGIN_ENABLE_DEBUG_ROUTE