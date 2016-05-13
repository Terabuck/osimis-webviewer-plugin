#pragma once

#include "IImageProcessingPolicy.h"

class PngConversionPolicy : public IImageProcessingPolicy {
public:
  virtual IImageContainer* Apply(IImageContainer* data, ImageMetaData* metaData);

  virtual std::string ToString() const 
  { 
    return "png";
  }
};