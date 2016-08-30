#include "PixelDataQualityPolicy.h"

PixelDataQualityPolicy::PixelDataQualityPolicy()
{
}

PixelDataQualityPolicy::~PixelDataQualityPolicy()
{
}

std::auto_ptr<IImageContainer> PixelDataQualityPolicy::Apply(std::auto_ptr<IImageContainer> input, ImageMetaData* metaData)
{
  return _klvPolicy.Apply(input, metaData);
}
