#ifndef IMAGE_REPOSITORY_H
#define IMAGE_REPOSITORY_H

#include <string>
#include <boost/thread/mutex.hpp>

#include "Image.h"

// #include "CompressionPolicy/IImageProcessingPolicy.h"

/** ImageRepository [@Repository]
 *
 * Retrieve an Image from an instance uid and a frame index.
 *
 * @Responsibility Handle all the I/O operations related to Images
 *
 * @Responsibility Manage cache
 *
 */
class ImageRepository {
public:
  // const means the result is not cached

  // gives memory ownership
  Image* GetImage(const std::string& instanceId, uint32_t frameIndex, bool enableCache) const;

  // gives memory ownership
  Image* GetImage(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy, bool enableCache) const;

private:
  mutable boost::mutex mutex_;

  Image* _GetImage(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const;
  Image* _GetImageFromCache(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const;
};

#endif // IMAGE_REPOSITORY_H
