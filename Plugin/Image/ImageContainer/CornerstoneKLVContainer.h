#ifndef CORNERSTONE_KLV_CONTAINER_H
#define CORNERSTONE_KLV_CONTAINER_H

#include <string>

#include "IImageContainer.h"
#include "../ImageMetaData.h"

class CornerstoneKLVContainer : public IImageContainer {
public:
  // does not take ownership
  CornerstoneKLVContainer(IImageContainer* data, const ImageMetaData* metaData);
  virtual ~CornerstoneKLVContainer();

  virtual const char* GetBinary();
  virtual uint32_t GetBinarySize();

private:
  std::string data_;

  enum Keys
  {
    // - Cornerstone (frontend) related

    Color,
    Height,
    Width,
    SizeInBytes, // size in raw prior to compression

    // Pixel size / aspect ratio
    ColumnPixelSpacing,
    RowPixelSpacing,

    // LUT
    MinPixelValue,
    MaxPixelValue,
    Slope,
    Intercept,
    WindowCenter,
    WindowWidth,


    // - WebViewer (frontend) related

    IsSigned,

    // when 16bit image is converted to 8 bit
    // used convert image back to 16bit in the web frontend
    Stretched,
    
    Compression,


    // - Image binary

    ImageBinary
  };
};

#endif // CORNERSTONE_KLV_CONTAINER_H