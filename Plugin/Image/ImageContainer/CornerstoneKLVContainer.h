#pragma once

#include <string>

#include "IImageContainer.h"
#include "../ImageMetaData.h"
#include "ScopedBuffers.h"

class CornerstoneKLVContainer : public IImageContainer {
public:
  // does not take ownership
  CornerstoneKLVContainer(IImageContainer* data, const ImageMetaData* metaData);
  // takes ownership
  CornerstoneKLVContainer(OrthancPluginMemoryBuffer& data);
  virtual ~CornerstoneKLVContainer() {}

  virtual const char* GetBinary() const;
  virtual uint32_t GetBinarySize() const;

private:
  std::string dataAsString_;
  ScopedOrthancPluginMemoryBuffer dataAsMemoryBuffer_;

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
