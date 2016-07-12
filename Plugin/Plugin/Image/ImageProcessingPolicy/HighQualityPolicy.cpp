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

IImageContainer* HighQualityPolicy::Apply(IImageContainer* input, ImageMetaData* metaData)
{
  return pngAndKlvPolicy_.Apply(input, metaData);
}
