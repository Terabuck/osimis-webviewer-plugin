#ifndef IMAGE_H
#define IMAGE_H

#include <string>

#include "../OrthancContextManager.h"
#include "ImageProcessingPolicy/IImageProcessingPolicy.h"

/** Image [@RootAggregate]
 *
 * Either
 * - a frame (for multiframe instance) or
 * - an instance (for monoframe instance)
 *
 */
class Image {
  friend class ImageRepository;

public:
  // destruction is done by end-user
  ~Image();

  const char* GetBinary() { // @todo const correctness
    return data_->GetBinary();
  }

  uint32_t GetBinarySize() { // @todo const correctness
    return data_->GetBinarySize();
  }

private:
  // creation is done by ImageRepository
  // takes memory ownership
  Image(const std::string& instanceId, uint32_t frameIndex, IImageContainer* data);

  void ApplyProcessing(IImageProcessingPolicy* policy);

private:
  std::string instanceId_;
  uint32_t frameIndex_;
  IImageContainer* data_;
};

#endif // IMAGE_H
