#include "LowQualityPolicy.h"
#include "ImageProcessingPolicy/ResizePolicy.h"
#include "ImageProcessingPolicy/Uint8ConversionPolicy.h"
#include "ImageProcessingPolicy/JpegConversionPolicy.h"
#include "ImageProcessingPolicy/KLVEmbeddingPolicy.h"

LowQualityPolicy::LowQualityPolicy()
{
  resampleAndJpegPolicy_.AddPolicy(new ResizePolicy(150));
  resampleAndJpegPolicy_.AddPolicy(new Uint8ConversionPolicy()); // Does nothing if already 8bit
  resampleAndJpegPolicy_.AddPolicy(new JpegConversionPolicy(80));
  resampleAndJpegPolicy_.AddPolicy(new KLVEmbeddingPolicy());

  // @todo move instantiation out of controller
}

LowQualityPolicy::~LowQualityPolicy()
{
}

IImageContainer* LowQualityPolicy::Apply(IImageContainer* input, ImageMetaData* metaData)
{
  return resampleAndJpegPolicy_.Apply(input, metaData);
}
