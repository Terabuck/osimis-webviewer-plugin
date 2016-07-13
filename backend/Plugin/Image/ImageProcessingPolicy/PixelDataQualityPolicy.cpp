#include "PixelDataQualityPolicy.h"

PixelDataQualityPolicy::PixelDataQualityPolicy()
{
}

PixelDataQualityPolicy::~PixelDataQualityPolicy()
{
}

IImageContainer* PixelDataQualityPolicy::Apply(IImageContainer* input, ImageMetaData* metaData)
{
  return _klvPolicy.Apply(input, metaData);
}
