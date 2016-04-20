#ifndef I_IMAGE_PROCESSING_POLICY_H
#define I_IMAGE_PROCESSING_POLICY_H

#include "../ImageContainer/IImageContainer.h"
#include "../ImageMetaData.h"

class IImageProcessingPolicy {
public:
  virtual ~IImageProcessingPolicy() {};
  virtual IImageContainer* Apply(IImageContainer* container, ImageMetaData* metaData) = 0;
};

#endif // I_IMAGE_PROCESSING_POLICY_H
