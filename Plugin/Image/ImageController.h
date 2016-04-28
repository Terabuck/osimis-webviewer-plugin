#ifndef IMAGE_ROUTE_H
#define IMAGE_ROUTE_H

#include <string>

#include "../BaseController.h"
#include "ImageRepository.h"
#include "Utilities/ImageProcessingRouteParser.h"
#include "ImageProcessingPolicy/IImageProcessingPolicy.h"


// .../<instance_id>/<frame_index>/<compression_policy>

class ImageController : public BaseController {
public:
  ImageController(OrthancPluginRestOutput* response, const std::string& url, const OrthancPluginHttpRequest* request);

  template<typename T>
  static void Inject(T* obj);

protected:
  virtual OrthancPluginErrorCode _ParseURLPostFix(const std::string& urlPostfix);
  virtual OrthancPluginErrorCode _ProcessRequest();

private:
  static ImageRepository* imageRepository_;
  ImageProcessingRouteParser imageProcessingRouteParser_;

  bool disableCache_;
  std::string instanceId_;
  uint32_t frameIndex_;
  IImageProcessingPolicy* processingPolicy_; // @todo use smart_ptr ?
};

#endif // IMAGE_ROUTE_H
