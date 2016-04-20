#ifndef UINT8_CONVERSION_POLICY_H
#define UINT8_CONVERSION_POLICY_H

#include "IImageProcessingPolicy.h"

class Uint8ConversionPolicy : public IImageProcessingPolicy {
public:
  // in: RawImageContainer PixelFormat_Grayscale16 || PixelFormat_Grayscale16
  // out: RawImageContainer PixelFormat_Grayscale8
  virtual IImageContainer* Apply(IImageContainer* input);
};

#endif // UINT8_CONVERSION_POLICY_H
