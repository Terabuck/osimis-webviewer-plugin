#include "ImageMetaData.h"

#include <cmath> // for std::pow
#include <vector>
#include <boost/foreach.hpp>
#include <boost/lexical_cast.hpp>
#include <boost/regex.hpp>
#include <boost/algorithm/string.hpp> // for boost::algorithm::split

#include "../BenchmarkHelper.h"
#include <Core/Toolbox.h> // for TokenizeString && StripSpaces
#include <Core/Images/ImageProcessing.h> // for GetMinMaxValue
#include <Core/OrthancException.h> // for throws

namespace
{
  float GetFloatTag(const Json::Value& dicomTags,
                           const std::string& tagName,
                           float defaultValue);
  std::vector<float> GetFloatListTag(const Json::Value& dicomTags,
                           const std::string& tagName,
                           float defaultValue);
  bool GetStringTag(std::string& result,
                           const Json::Value& dicomTags,
                           const std::string& tagName);
}

using namespace Orthanc;

ImageMetaData::ImageMetaData()
{
  color = false;
  height = 0;
  width = 0;
  sizeInBytes = 0;

  columnPixelSpacing = 0;
  rowPixelSpacing = 0;

  minPixelValue = 0;
  maxPixelValue = 0;
  slope = 0;
  intercept = 0;
  windowCenter = 0;

  // frontend webviewer related
  isSigned = false;
  stretched = false;
  compression = "raw";

  originalHeight = 0;
  originalWidth = 0;
}

ImageMetaData::ImageMetaData(RawImageContainer* rawImage, const Json::Value& dicomTags)
{
  // Generate metadata from an image and its tags

  BENCH(CALCULATE_METADATA)
  ImageAccessor* accessor = rawImage->GetOrthancImageAccessor();

  // define
  // - color
  // - minPixelValue & maxPixelValue (calculated)
  // - windowCenter & windowWidth (default values)
  switch (accessor->GetFormat())
  {
    case PixelFormat_Grayscale8:
    case PixelFormat_Grayscale16:
    case PixelFormat_SignedGrayscale16:
    {
      int64_t a, b;

      color = false;

      // @todo don't process when tag is available
      ImageProcessing::GetMinMaxValue(a, b, *accessor);
      minPixelValue = (a < 0 ? static_cast<int32_t>(a) : 0);
      maxPixelValue = (b > 0 ? static_cast<int32_t>(b) : 1);
      
      windowCenter = static_cast<float>(a + b) / 2.0f;
      
      if (a == b)
      {
        windowWidth = 256.0f;  // Arbitrary value
      }
      else
      {
        windowWidth = static_cast<float>(b - a) / 2.0f;
      }

      break;
    }
    case PixelFormat_RGB24:
    {
      color = true;

      minPixelValue = 0;
      maxPixelValue = 255;
      windowCenter = 127.5f;
      windowWidth = 256.0f;
      break;
    }
    default:
    {
      // @todo throw
    }
  }

  // set width/height
  height = accessor->GetHeight();
  width = accessor->GetWidth();
  
  // set sizeInBytes
  sizeInBytes = accessor->GetSize();

  // set slope/intercept
  slope = GetFloatTag(dicomTags, "RescaleSlope", 1.0f);
  intercept = GetFloatTag(dicomTags, "RescaleIntercept", 0.0f);

  // set windowCenter & windowWidth (image specific)
  // @todo manage multiple ww/wc (this requires specific UI - we only consider the first one at the moment)
  windowCenter = GetFloatListTag(dicomTags, "WindowCenter", windowCenter * slope + intercept)[0];
  windowWidth = GetFloatListTag(dicomTags, "WindowWidth", windowWidth * slope)[0];

  // set rowPixelSpacing/columnPixelSpacing
  bool dicomHasPixelSpacing = false;
  std::string pixelSpacing;
  if (GetStringTag(pixelSpacing, dicomTags, "PixelSpacing"))
  {
    std::vector<std::string> tokens;
    // '\' is the standard separator in dicom string
    // see http://dicom.nema.org/dicom/2013/output/chtml/part05/sect_6.2.html
    Toolbox::TokenizeString(tokens, pixelSpacing, '\\');

    if (tokens.size() >= 2)
    {
      try
      {
        columnPixelSpacing = boost::lexical_cast<float>(Toolbox::StripSpaces(tokens[1]));
        rowPixelSpacing = boost::lexical_cast<float>(Toolbox::StripSpaces(tokens[0]));
        dicomHasPixelSpacing = true;
      }
      catch (boost::bad_lexical_cast&)
      {
      }
    }
  }

  if (!dicomHasPixelSpacing)
  {
    columnPixelSpacing = 1.0f;
    rowPixelSpacing = 1.0f;
  }

  // frontend webviewer related
  isSigned = (accessor->GetFormat() == PixelFormat_SignedGrayscale16);
  stretched = false;
  compression = "raw";

  originalHeight = accessor->GetHeight();
  originalWidth = accessor->GetWidth();

  BENCH_LOG(IMAGE_WIDTH, width);
  BENCH_LOG(IMAGE_HEIGHT, height);
}

ImageMetaData::ImageMetaData(const DicomMap& headerTags, const Json::Value& dicomTags)
{
  // Generate metadata from tags only (a bit less accurate than the other constructor - maxPixelValue can't be processed from image)
  // headerTags retrieved from dicom file
  // dicomTags retrived from Orthanc sqlite

  BENCH(CALCULATE_METADATA)

  // define color
  std::string photometricInterpretation = Toolbox::StripSpaces(dicomTags["PhotometricInterpretation"].asString());
  if (photometricInterpretation == "MONOCHROME1" || photometricInterpretation == "MONOCHROME2") {
    color = false;
  }
  else {
    color = true;
  }

  // set minPixelValue & maxPixelValue
  int bitsStored = boost::lexical_cast<int>(Toolbox::StripSpaces(dicomTags["BitsStored"].asString()));
  minPixelValue = 0; // approximative value
  maxPixelValue = std::pow(2, bitsStored); // approximative value

  // set width/height
  width = boost::lexical_cast<uint32_t>(Toolbox::StripSpaces(dicomTags["Columns"].asString()));
  height = boost::lexical_cast<uint32_t>(Toolbox::StripSpaces(dicomTags["Rows"].asString()));

  // set sizeInBytes
  int bitsAllocated = boost::lexical_cast<int>(Toolbox::StripSpaces(dicomTags["BitsAllocated"].asString())) * (color ? 3 : 1);
  sizeInBytes = width * height * bitsAllocated;

  // set slope/intercept
  slope = GetFloatTag(dicomTags, "RescaleSlope", 1.0f);
  intercept = GetFloatTag(dicomTags, "RescaleIntercept", 0.0f);

  // set windowCenter & windowWidth (image specific)
  // @todo manage multiple ww/wc (this requires specific UI - we only consider the first one at the moment)
  windowCenter = GetFloatListTag(dicomTags, "WindowCenter", 127.5f * slope + intercept)[0];
  windowWidth = GetFloatListTag(dicomTags, "WindowWidth", 256.0f * slope)[0];

  // set rowPixelSpacing/columnPixelSpacing
  bool dicomHasPixelSpacing = false;
  std::string pixelSpacing;
  if (GetStringTag(pixelSpacing, dicomTags, "PixelSpacing"))
  {
    std::vector<std::string> tokens;
    Toolbox::TokenizeString(tokens, pixelSpacing, '\\');

    if (tokens.size() >= 2)
    {
      try
      {
        columnPixelSpacing = boost::lexical_cast<float>(Toolbox::StripSpaces(tokens[1]));
        rowPixelSpacing = boost::lexical_cast<float>(Toolbox::StripSpaces(tokens[0]));
        dicomHasPixelSpacing = true;
      }
      catch (boost::bad_lexical_cast&)
      {
      }
    }
  }

  if (!dicomHasPixelSpacing)
  {
    columnPixelSpacing = 1.0f;
    rowPixelSpacing = 1.0f;
  }

  // frontend webviewer related

  // set signed pixels
  isSigned = boost::lexical_cast<bool>(Toolbox::StripSpaces(dicomTags["PixelRepresentation"].asString()));

  // set stretched image (16bit -> 8bit dynamic compression)
  stretched = false;

  // Retrieve transfer syntax
  const DicomValue* transfertSyntaxValue = headerTags.TestAndGetValue(0x0002, 0x0010);
  std::string transferSyntax;

  if (transfertSyntaxValue != NULL && transfertSyntaxValue->IsBinary()) {
    throw OrthancException(static_cast<ErrorCode>(OrthancPluginErrorCode_CorruptedFile));
  }
  else if (transfertSyntaxValue == NULL || transfertSyntaxValue->IsNull()) {
    // Set default transfer syntax if not found
    transferSyntax = "1.2.840.10008.1.2";
  }
  else {
    // Stripping spaces should not be required, as this is a UI value
    // representation whose stripping is supported by the Orthanc
    // core, but let's be careful...
    transferSyntax = Toolbox::StripSpaces(transfertSyntaxValue->GetContent());
  }

  // set compression format @todo
  boost::regex regexp("^1\\.2\\.840\\.10008\\.1\\.2\\.4\\.(\\d\\d)$"); // see http://www.dicomlibrary.com/dicom/transfer-syntax/
  boost::cmatch matches;
  if (boost::regex_match(transferSyntax.c_str(), matches, regexp)) {
    switch(boost::lexical_cast<uint32_t>(matches[1])) {
    case 50: // Lossy JPEG 8-bit Image Compression
      compression = "jpeg";
      break;
    // case 51: // Lossy JPEG 12-bit Image Compression
    //   compression = "jpeg";
    //   break;
    // case 57: // JPEG Lossless, Nonhierarchical (Processes 14)
    //   compression = "jpeg-lossless";
    //   break;
    case 70: // JPEG Lossless, Nonhierarchical, First-Order Prediction (Default Transfer Syntax for Lossless JPEG Image Compression)
      compression = "jpeg-lossless";
      break;
    // case 80: // JPEG-LS Lossless Image Compression
    //   compression = "jpeg";
    //   break;
    // case 81: // JPEG-LS Lossy (Near- Lossless) Image Compression
    //   compression = "jpeg";
    //   break;
    // case 90: // JPEG 2000 Image Compression (Lossless Only)
    //   compression = "jpeg2000";
    //   break;
    // case 91: // JPEG 2000 Image Compression
    //   compression = "jpeg2000";
    //   break;
    // case 92: // JPEG 2000 Part 2 Multicomponent Image Compression (Lossless Only)
    //   compression = "jpeg2000";
    //   break;
    // case 93: // JPEG 2000 Part 2 Multicomponent Image Compression
    //   compression = "jpeg2000";
    //   break;

    // case 94: // JPIP Referenced
    //   compression = "jpip";
    //   break;
    // case 95: // JPIP Referenced Deflate
    //   compression = "jpip";
    //   break;

    default:
      // @todo @warning can be called via route pixeldata! throw exception instead (may change in long term)
      assert(true);
      break;
    }
  }
  else {
    assert(true);
  }

  // set original height & width
  originalHeight = boost::lexical_cast<uint32_t>(Toolbox::StripSpaces(dicomTags["Rows"].asString()));
  originalWidth = boost::lexical_cast<uint32_t>(Toolbox::StripSpaces(dicomTags["Columns"].asString()));

  BENCH_LOG(IMAGE_WIDTH, width);
  BENCH_LOG(IMAGE_HEIGHT, height);
}

namespace {
  float GetFloatTag(const Json::Value& dicomTags,
                           const std::string& tagName,
                           float defaultValue)
  {
    std::string tmp;
    if (GetStringTag(tmp, dicomTags, tagName))
    {
      try
      {
        return boost::lexical_cast<float>(Toolbox::StripSpaces(tmp));
      }
      catch (boost::bad_lexical_cast&)
      {
      }
    }

    return defaultValue;
  }

  std::vector<float> GetFloatListTag(const Json::Value& dicomTags,
                           const std::string& tagName,
                           float defaultValue)
  {
    std::string fullStr;
    std::vector<float> floatList;

    if(GetStringTag(fullStr, dicomTags, tagName)) {
      // Split tags content by "\" character
      std::vector<std::string> strs;
      boost::algorithm::split(strs, fullStr, boost::is_any_of("\\"));

      // Convert each part of the string to float
      BOOST_FOREACH(const std::string& str, strs)
      {
        try
        {
          float value = boost::lexical_cast<float>(Toolbox::StripSpaces(str));
          floatList.push_back(value);
        }
        catch (boost::bad_lexical_cast&)
        {
        }
      }
    }

    // Set the default value if none has been found
    if (floatList.size() == 0)
    {
      floatList.push_back(defaultValue);
    }
    
    return floatList;
  }

  bool GetStringTag(std::string& result,
                           const Json::Value& dicomTags,
                           const std::string& tagName)
  {
    if (dicomTags.type() == Json::objectValue &&
        dicomTags.isMember(tagName) &&
        dicomTags[tagName].type() == Json::stringValue)
    {
      result = dicomTags[tagName].asString();
      return true;
    }        
    else
    {
      return false;
    }
  }
}
