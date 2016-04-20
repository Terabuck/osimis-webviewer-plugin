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

Image::Image(const std::string& instanceId, uint32_t frameIndex, IImageContainer* data, const ImageMetaData& metaData)
  : metaData_(metaData)
{
  instanceId_ = instanceId;
  frameIndex_ = frameIndex;
  data_ = data;
}

const char* Image::GetBinary() {
  return data_->GetBinary();
}
uint32_t Image::GetBinarySize() {
  return data_->GetBinarySize();
}

void Image::ApplyProcessing(IImageProcessingPolicy* policy)
{
  IImageContainer* oldData = data_;
  data_ = policy->Apply(oldData, &metaData_);
  delete oldData;
}
