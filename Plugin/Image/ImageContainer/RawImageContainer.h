#ifndef RAW_IMAGE_CONTAINER_H
#define RAW_IMAGE_CONTAINER_H

#include "../../OrthancContextManager.h"
#include "../../ViewerToolbox.h" // for OrthancPluginImage
#include "../../Orthanc/Plugins/Samples/GdcmDecoder/OrthancImageWrapper.h" // for OrthancImageWrapper
#include "../../Orthanc/Core/Images/ImageAccessor.h" // for ImageAccessor
#include "../../Orthanc/Core/Images/ImageBuffer.h" // for ImageBuffer
#include "IImageContainer.h"

class RawImageContainer : public IImageContainer {
public:
  // takes ownership
  RawImageContainer(OrthancPluginImage* data);
  // takes ownership
  RawImageContainer(Orthanc::ImageBuffer* data);

  virtual ~RawImageContainer();

  virtual const char* GetBinary();
  virtual uint32_t GetBinarySize();

  // can be used by ImageProcessingPolicy to retrieve additionnal informations
  Orthanc::ImageAccessor* GetOrthancImageAccessor();

private:
  Orthanc::ImageBuffer* dataAsImageBuffer_;
  OrthancPlugins::OrthancImageWrapper* dataAsImageWrapper_;
  Orthanc::ImageAccessor accessor_;
};

#endif // RAW_IMAGE_CONTAINER_H
