#pragma once

#include <boost/lexical_cast.hpp>
#include "IImageProcessingPolicy.h"

class ResizePolicy : public IImageProcessingPolicy {
public:
  ResizePolicy(unsigned int maxWidthHeight);
  virtual std::auto_ptr<IImageContainer> Apply(std::auto_ptr<IImageContainer> data, ImageMetaData* metaData);

  virtual std::string ToString() const;

private:
  unsigned int maxWidthHeight_;
};