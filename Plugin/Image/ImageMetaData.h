#ifndef IMAGE_META_DATA_H
#define IMAGE_META_DATA_H

#include <string>
#include <boost/cstdint.hpp> // for uint32_t
#include <json/writer.h> // for Json::Value

#include "ImageContainer/RawImageContainer.h"

/** ImageMetaData [@Entity]
 *
 */
struct ImageMetaData {
  ImageMetaData();

  // @todo const RawImageContainer
  ImageMetaData(RawImageContainer* rawImage, const Json::Value& dicomTags);

  // - Cornerstone (frontend) related

  bool color;
  uint32_t height;
  uint32_t width;
  uint32_t sizeInBytes; // size in raw prior to compression

  // Pixel size / aspect ratio
  uint32_t columnPixelSpacing;
  uint32_t rowPixelSpacing;

  // LUT
  uint32_t minPixelValue;
  uint32_t maxPixelValue;
  float slope;
  float intercept;
  float windowCenter;
  float windowWidth;

  // - WebViewer (frontend) related

  bool isSigned;

  // when 16bit image is converted to 8 bit
  // used convert image back to 16bit in the web frontend
  bool stretched;
  
  std::string compression;
};

#endif //IMAGE_META_DATA_H