#ifndef JPEG_IMAGE_CONTAINER_H
#define JPEG_IMAGE_CONTAINER_H

#include <orthanc/OrthancCPlugin.h> // for OrthancPluginMemoryBuffer
#include "IImageContainer.h"

// For Jpeg or Png, pure binary with no access to image data
class CompressedImageContainer : public IImageContainer {
public:
  // takes ownership
  CompressedImageContainer(OrthancPluginMemoryBuffer* buffer);
  virtual ~CompressedImageContainer();

  virtual const char* GetBinary();
  virtual uint32_t GetBinarySize();

private:
  OrthancPluginMemoryBuffer* data_;
};

#endif // JPEG_IMAGE_CONTAINER_H
