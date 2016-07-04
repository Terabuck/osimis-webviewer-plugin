#ifndef IMAGE_REPOSITORY_H
#define IMAGE_REPOSITORY_H

#include <string>
#include <boost/thread/mutex.hpp>
#include <orthanc/OrthancCPlugin.h>

#include "../Instance/DicomRepository.h"
#include "Image.h"

/** ImageRepository [@Repository]
 *
 * Retrieve an Image from an instance uid and a frame index.
 *
 * @Responsibility Handle all the I/O operations related to Images
 *
 * @Responsibility Manage cache
 *
 */
// @todo boost::noncopyable
class ImageRepository {
public:
  ImageRepository(DicomRepository* dicomRepository);

  // gives memory ownership
  Image* GetImage(const std::string& instanceId, uint32_t frameIndex, bool enableCache) const;

  // gives memory ownership
  Image* GetImage(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy, bool enableCache) const;

  void CleanImageCache(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const;

  void enableCachedImageStorage(bool enable) {_cachedImageStorageEnabled = enable;}
  bool isCachedImageStorageEnabled() const {return _cachedImageStorageEnabled;}

private:
  DicomRepository* _dicomRepository;
  bool _cachedImageStorageEnabled;
  mutable boost::mutex mutex_;

  Image* _GetImage(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const;
  Image* _GetImageFromCache(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const;
};

#endif // IMAGE_REPOSITORY_H
