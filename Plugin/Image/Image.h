#ifndef IMAGE_H
#define IMAGE_H

#include <string>
#include <json/writer.h> // for Json::Value

#include "../OrthancContextManager.h"
#include "ImageContainer/IImageContainer.h"
#include "ImageContainer/RawImageContainer.h"
#include "ImageProcessingPolicy/IImageProcessingPolicy.h"
#include "ImageMetaData.h"

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

  const char* GetBinary(); // @todo const correctness
  uint32_t GetBinarySize(); // @todo const correctness

private:
  // creation is done by ImageRepository
  // takes memory ownership
  Image(const std::string& instanceId, uint32_t frameIndex, RawImageContainer* data, const Json::Value& dicomTags);

  // takes memory ownership
  Image(const std::string& instanceId, uint32_t frameIndex, IImageContainer* data, const ImageMetaData& metaData);

  void ApplyProcessing(IImageProcessingPolicy* policy);

private:
  std::string instanceId_;
  uint32_t frameIndex_;
  IImageContainer* data_;
  ImageMetaData metaData_;
};

#endif // IMAGE_H
