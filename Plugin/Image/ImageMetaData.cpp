#include "ImageMetaData.h"

#include <boost/lexical_cast.hpp>

#include "../BenchmarkHelper.h"
#include "../../Orthanc/Core/Toolbox.h" // for TokenizeString && StripSpaces
#include "../../Orthanc/Core/Images/ImageProcessing.h" // for GetMinMaxValue

namespace
{
  float GetFloatTag(const Json::Value& dicomTags,
                           const std::string& tagId,
                           float defaultValue);
  bool GetStringTag(std::string& result,
                           const Json::Value& dicomTags,
                           const std::string& tagId);
}

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
  BENCH(CALCULATE_METADATA)
  Orthanc::ImageAccessor* accessor = rawImage->GetOrthancImageAccessor();

  // define
  // - color
  // - minPixelValue & maxPixelValue (calculated)
  // - windowCenter & windowWidth (default values)
  switch (accessor->GetFormat())
  {
    case Orthanc::PixelFormat_Grayscale8:
    case Orthanc::PixelFormat_Grayscale16:
    case Orthanc::PixelFormat_SignedGrayscale16:
    {
      int64_t a, b;

      color = false;

      Orthanc::ImageProcessing::GetMinMaxValue(a, b, *accessor);
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
    case Orthanc::PixelFormat_RGB24:
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
  slope = GetFloatTag(dicomTags, "0028,1053", 1.0f);
  intercept = GetFloatTag(dicomTags, "0028,1052", 0.0f);

  // set windowCenter & windowWidth (image specific)
  windowCenter = GetFloatTag(dicomTags, "0028,1050", windowCenter * slope + intercept);
  windowWidth = GetFloatTag(dicomTags, "0028,1051", windowWidth * slope);

  // set rowPixelSpacing/columnPixelSpacing
  bool dicomHasPixelSpacing = false;
  std::string pixelSpacing;
  if (GetStringTag(pixelSpacing, dicomTags, "0028,0030"))
  {
    std::vector<std::string> tokens;
    Orthanc::Toolbox::TokenizeString(tokens, pixelSpacing, '\\');

    if (tokens.size() >= 2)
    {
      try
      {
        columnPixelSpacing = boost::lexical_cast<float>(Orthanc::Toolbox::StripSpaces(tokens[1]));
        rowPixelSpacing = boost::lexical_cast<float>(Orthanc::Toolbox::StripSpaces(tokens[0]));
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
  isSigned = (accessor->GetFormat() == Orthanc::PixelFormat_SignedGrayscale16);
  stretched = false;
  compression = "raw";

  originalHeight = accessor->GetHeight();
  originalWidth = accessor->GetWidth();

  BENCH_LOG(IMAGE_WIDTH, width);
  BENCH_LOG(IMAGE_HEIGHT, height);
}

namespace {
  float GetFloatTag(const Json::Value& dicomTags,
                           const std::string& tagId,
                           float defaultValue)
  {
    std::string tmp;
    if (GetStringTag(tmp, dicomTags, tagId))
    {
      try
      {
        return boost::lexical_cast<float>(Orthanc::Toolbox::StripSpaces(tmp));
      }
      catch (boost::bad_lexical_cast&)
      {
      }
    }

    return defaultValue;
  }

  bool GetStringTag(std::string& result,
                           const Json::Value& dicomTags,
                           const std::string& tagId)
  {
    if (dicomTags.type() == Json::objectValue &&
        dicomTags.isMember(tagId) &&
        dicomTags[tagId].type() == Json::objectValue &&
        dicomTags[tagId].isMember("Type") &&
        dicomTags[tagId].isMember("Value") &&
        dicomTags[tagId]["Type"].type() == Json::stringValue &&
        dicomTags[tagId]["Value"].type() == Json::stringValue &&
        dicomTags[tagId]["Type"].asString() == "String")
    {
      result = dicomTags[tagId]["Value"].asString();
      return true;
    }        
    else
    {
      return false;
    }
  }
}
