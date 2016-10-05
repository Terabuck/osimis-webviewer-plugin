#ifndef JPEG_CONVERSION_POLICY_H
#define JPEG_CONVERSION_POLICY_H

#include <boost/lexical_cast.hpp>
#include "IImageProcessingPolicy.h"

class JpegConversionPolicy : public IImageProcessingPolicy {
public:
  // quality: [0:100]
  JpegConversionPolicy(int quality);
  virtual ~JpegConversionPolicy();

  // in: RawImageContainer<8bit>
  // out: JpegImageContainer
  // @throws Orthanc::OrthancException
  virtual std::auto_ptr<IImageContainer> Apply(std::auto_ptr<IImageContainer> input, ImageMetaData* metaData);

  virtual std::string ToString() const 
  { 
    return "jpeg:" + boost::lexical_cast<std::string>(quality_);
  }

private:
  int quality_;
};

#endif // JPEG_CONVERSION_POLICY_H
