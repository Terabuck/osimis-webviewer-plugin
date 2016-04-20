#ifndef IMAGE_REPOSITORY_H
#define IMAGE_REPOSITORY_H

#include <string>

#include "Image.h"

// #include "CompressionPolicy/IImageProcessingPolicy.h"

/** ImageRepository [@Repository]
 *
 * Retrieve an Image from an instance uid and a frame index.
 *
 * @Responsibility Handle all the I/O operations related to Images,
 * including the communication with the Orthanc's core.
 *
 * @Responsibility Manage cache
 *
 */
class ImageRepository {
public:
  // const means the result is not cached

  // gives memory ownership
  Image* GetImage(const std::string& instanceId, uint32_t frameIndex) const;

  // gives memory ownership
  Image* GetImage(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const;
};

#endif // IMAGE_REPOSITORY_H
