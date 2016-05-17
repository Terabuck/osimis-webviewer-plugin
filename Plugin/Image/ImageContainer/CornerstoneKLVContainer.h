#ifndef CORNERSTONE_KLV_CONTAINER_H
#define CORNERSTONE_KLV_CONTAINER_H

#include <string>

#include "IImageContainer.h"
#include "../ImageMetaData.h"

class CornerstoneKLVContainer : public IImageContainer {
public:
  // does not take ownership
  CornerstoneKLVContainer(IImageContainer* data, const ImageMetaData* metaData);
  // takes ownership
  CornerstoneKLVContainer(OrthancPluginMemoryBuffer* data);
  virtual ~CornerstoneKLVContainer();

  virtual const char* GetBinary();
  virtual uint32_t GetBinarySize();

private:
  std::string dataAsString_;
  OrthancPluginMemoryBuffer* dataAsMemoryBuffer_;

  enum Keys
  {
    // - Meta Data (see ImageMetaData.h for informations)
    Color,
    Height,
    Width,
    SizeInBytes,
    ColumnPixelSpacing,
    RowPixelSpacing,
    MinPixelValue,
    MaxPixelValue,
    Slope,
    Intercept,
    WindowCenter,
    WindowWidth,
    IsSigned,
    Stretched,
    Compression,
    OriginalHeight,
    OriginalWidth,

    // - Image binary
    ImageBinary
  };
};

#endif // CORNERSTONE_KLV_CONTAINER_H