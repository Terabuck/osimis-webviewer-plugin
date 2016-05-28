#ifndef IMAGE_REPOSITORY_H
#define IMAGE_REPOSITORY_H

#include <string>
#include <deque>
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

  struct DicomFile
  {
    std::string                     instanceId;
    OrthancPluginMemoryBuffer       dicomFileBuffer;
    int                             refCount;
  };

public:
  ImageRepository();

  // gives memory ownership
  Image* GetImage(const std::string& instanceId, uint32_t frameIndex, bool enableCache) const;

  // gives memory ownership
  Image* GetImage(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy, bool enableCache) const;

  void CleanImageCache(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const;

  void enableCachedImageStorage(bool enable) {_cachedImageStorageEnabled = enable;}
  bool isCachedImageStorageEnabled() const {return _cachedImageStorageEnabled;}
private:
  bool                                                    _cachedImageStorageEnabled;
  mutable std::deque<DicomFile>                           _dicomFiles; //keep a few of the last dicomFile in memory to avoid reloading them many times when requesting different frames or different image quality
  mutable boost::mutex                                    _dicomFilesMutex; //to prevent multiple threads modifying the _dicomFiles

  bool getDicomFile(const std::string instanceId, OrthancPluginMemoryBuffer& buffer) const;
//  void increfDicomFile(const std::string instanceId);
  void decrefDicomFile(const std::string instanceId) const;
//  void addDicomFile(const std::string instanceId, OrthancPluginMemoryBuffer& buffer);

  mutable boost::mutex mutex_;

  Image* _GetImage(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const;
  Image* _GetImageFromCache(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const;
};

#endif // IMAGE_REPOSITORY_H
