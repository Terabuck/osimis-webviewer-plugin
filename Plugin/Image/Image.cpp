#include "Image.h"

Image::~Image()
{
  delete data_;
}

Image::Image(const std::string& instanceId, uint32_t frameIndex, RawImageContainer* data, const Json::Value& dicomTags)
  : metaData_(data, dicomTags)
{
  instanceId_ = instanceId;
  frameIndex_ = frameIndex;
  data_ = data;
}

Image::Image(const std::string& instanceId, uint32_t frameIndex, CornerstoneKLVContainer* data)
  : metaData_()
{
  // @todo @warning metaData_ aren't consistent !
  // fetch them from data with struct definition ? direct copy ?
  instanceId_ = instanceId;
  frameIndex_ = frameIndex;
  data_ = data;
}

void Image::ApplyProcessing(IImageProcessingPolicy* policy)
{
  IImageContainer* oldData = data_;
  data_ = policy->Apply(oldData, &metaData_);
  delete oldData;
}
