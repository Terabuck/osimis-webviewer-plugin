#pragma once

#include "IImageProcessingPolicy.h"
#include "KLVEmbeddingPolicy.h"

/* PixelDataQualityPolicy
 *
 * @Responsibility Embbed image in KLV
 *
 */
class PixelDataQualityPolicy : public IImageProcessingPolicy {
public:
  PixelDataQualityPolicy();
  virtual ~PixelDataQualityPolicy();
  virtual IImageContainer* Apply(IImageContainer* input, ImageMetaData* metaData);

  virtual std::string ToString() const
  {
    return "pixeldata-quality";
  }

private:
  KLVEmbeddingPolicy _klvPolicy;
};
