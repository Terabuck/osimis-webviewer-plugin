#include "Image.h"

Image::~Image()
{
  delete data_;
}

Image::Image(const std::string& instanceId, uint32_t frameIndex, IImageContainer* data)
  : instanceId_(instanceId), frameIndex_(frameIndex), data_(data)
{
  
}

void Image::ApplyProcessing(IImageProcessingPolicy* policy)
{
  IImageContainer* oldData = data_;
  data_ = policy->Apply(oldData);
  delete oldData;
}