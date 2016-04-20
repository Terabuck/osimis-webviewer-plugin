#ifndef JPEG_CONVERSION_POLICY_H
#define JPEG_CONVERSION_POLICY_H

#include "IImageProcessingPolicy.h"

class JpegConversionPolicy : public IImageProcessingPolicy {
public:
  // quality: [0:100]
  JpegConversionPolicy(int quality);
  virtual ~JpegConversionPolicy();

  // in: RawImageContainer<8bit>
  // out: JpegImageContainer
  virtual IImageContainer* Apply(IImageContainer* input);

private:
  int quality_;
};

#endif // JPEG_CONVERSION_POLICY_H
