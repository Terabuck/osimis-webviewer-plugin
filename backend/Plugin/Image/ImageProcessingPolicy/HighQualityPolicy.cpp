#include "HighQualityPolicy.h"
#include "ImageProcessingPolicy/PngConversionPolicy.h"
#include "ImageProcessingPolicy/KLVEmbeddingPolicy.h"

HighQualityPolicy::HighQualityPolicy()
{
  pngAndKlvPolicy_.AddPolicy(new PngConversionPolicy());
  pngAndKlvPolicy_.AddPolicy(new KLVEmbeddingPolicy());
}

HighQualityPolicy::~HighQualityPolicy()
{
}

std::auto_ptr<IImageContainer> HighQualityPolicy::Apply(std::auto_ptr<IImageContainer> input, ImageMetaData* metaData)
{
  return pngAndKlvPolicy_.Apply(input, metaData);
}
