#pragma once

#include <string>
#include <boost/cstdint.hpp> // for uint32_t
#include <json/writer.h> // for Json::Value

#include <Core/DicomFormat/DicomMap.h>
#include "ImageContainer/RawImageContainer.h"
#include "ImageContainer/IImageContainer.h"

/** ImageMetaData [@Entity]
 * 
 */
struct ImageMetaData : public boost::noncopyable {
  ImageMetaData();

  // @todo const RawImageContainer
  
  // This constructor is called when the image object is created from an
  // uncompressed image. We thus have direct access to the raw pixel.
  // @deprecated since we should only do pixel-based computations on the
  //     frontend since we can't always rely on them.
  ImageMetaData(RawImageContainer* rawImage, const Json::Value& dicomTags);

  // This constructor is called when the image object is created from a
  // compressed image embedded within the dicom file. We use it for performance
  // optimisation (so we don't have to decompress the whole image and then
  // recompress it).
  ImageMetaData(const Orthanc::DicomMap& headerTags, const Json::Value& dicomTags);

  // - Cornerstone (frontend) related

  // -> Dicom Tags -> photometricInterpretation != "MONOCHROME1" && photometricInterpretation != "MONOCHROME2"
  bool color;

  // -> Compression format -> jpeg | Dicom Tags else
  uint32_t height;
  uint32_t width;

  // -> Dicom Tags -> Row * Col * BitsAllocated.
  uint32_t sizeInBytes; // size in raw prior to compression

  // Pixel size / aspect ratio
  // -> Dicom Tags
  float columnPixelSpacing;
  float rowPixelSpacing;

  // LUT
  // @deprecated
  // -> Dicom Tag
  float slope;
  float intercept;
  float windowCenter;
  float windowWidth;

  // - WebViewer (frontend) related

  // -> Dicom Tag (PixelRepresentation)
  bool isSigned;

  // -> Plugin
  // When 16bit image is converted to 8 bit, used convert image back to 16bit
  // in the web frontend with `minPixelValue` & `maxPixelValue`.
  // !
  // From route + BitsAllocated - if jpeg -> always stretched to 8bit.
  bool stretched;
  // -> Dicom Tags (from BitsStored)
  int32_t minPixelValue;
  int32_t maxPixelValue;

  // -> Dicom Tag (Row / Column)
  // Used to retrieve original coordinate when resampling is applied.
  uint32_t originalHeight;
  uint32_t originalWidth;
  
  // Compression Pormat
  // !
  // From route
  std::string compression;
};
