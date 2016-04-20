#ifndef JPEG_IMAGE_CONTAINER_H
#define JPEG_IMAGE_CONTAINER_H

#include <orthanc/OrthancCPlugin.h> // for OrthancPluginMemoryBuffer
#include "IImageContainer.h"

class JpegImageContainer : public IImageContainer {
public:
  // takes ownership
  JpegImageContainer(OrthancPluginMemoryBuffer* buffer);
  virtual ~JpegImageContainer();

  virtual const char* GetBinary();
  virtual uint32_t GetBinarySize();

private:
  OrthancPluginMemoryBuffer* data_;
};

#endif // JPEG_IMAGE_CONTAINER_H
