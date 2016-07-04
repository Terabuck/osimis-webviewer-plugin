#pragma once

#include "IImageProcessingPolicy.h"

class PngConversionPolicy : public IImageProcessingPolicy {
public:
  // @throws Orthanc::OrthancException
  virtual IImageContainer* Apply(IImageContainer* data, ImageMetaData* metaData);

  virtual std::string ToString() const 
  { 
    return "png";
  }
};