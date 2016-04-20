#ifndef I_IMAGE_PROCESSING_POLICY_H
#define I_IMAGE_PROCESSING_POLICY_H

#include "../ImageContainer/IImageContainer.h"

class IImageProcessingPolicy {
public:
  virtual ~IImageProcessingPolicy() {};
  virtual IImageContainer* Apply(IImageContainer* container) = 0;
};

#endif // I_IMAGE_PROCESSING_POLICY_H
