/**
 * Orthanc - A Lightweight, RESTful DICOM Store
 * Copyright (C) 2012-2016 Sebastien Jodogne, Medical Physics
 * Department, University Hospital of Liege, Belgium
 *
 * This program is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 **/


#include "DecodedImageAdapter.h"

#include <memory>
#include <boost/lexical_cast.hpp>
#include <boost/algorithm/string/predicate.hpp>
#include <json/writer.h>
#include <boost/regex.hpp>

#include <Core/Images/ImageBuffer.h>
#include <Core/Images/ImageProcessing.h>
#include <Core/OrthancException.h>
#include <Core/Toolbox.h>
#include <Plugins/Samples/GdcmDecoder/OrthancImageWrapper.h>
#include <Resources/ThirdParty/base64/base64.h>
#include "../ViewerToolbox.h"
#include "../BenchmarkHelper.h"
#include "Utilities/KLVWriter.h"
#include "Utilities/ScopedBuffers.h"

namespace OrthancPlugins
{
  bool DecodedImageAdapter::ParseUri(CompressionType& type,
                                     uint8_t& compressionLevel,
                                     std::string& instanceId,
                                     unsigned int& frameIndex,
                                     const std::string& uri)
  {
    boost::regex pattern("^([a-z0-9]+)-([a-z0-9-]+)_([0-9]+)$");

    boost::cmatch what;
    if (!regex_match(uri.c_str(), what, pattern))
    {
      return false;
    }

    std::string compression(what[1]);
    instanceId = what[2];
    frameIndex = boost::lexical_cast<unsigned int>(what[3]);

    BENCH_LOG(INSTANCE, instanceId);
    BENCH_LOG(FRAME_INDEX, frameIndex);
    BENCH_LOG(COMPRESSION_FORMAT, compression);

    if (compression == "deflate")
    {
      type = CompressionType_Deflate;
    }
    else if (boost::starts_with(compression, "jpeg"))
    {
      type = CompressionType_Jpeg;
      int level = boost::lexical_cast<int>(compression.substr(4));
      if (level <= 0 || level > 100)
      {
        return false;
      }

      compressionLevel = static_cast<uint8_t>(level);
    }
    else
    {
      return false;
    }

    return true;
  }



  bool DecodedImageAdapter::Create(std::string& content,
                                   const std::string& uri)
  {
    BENCH(FULL_PROCESS);

    OrthancPluginLogInfo(context_, std::string("Decoding DICOM instance: " + uri).c_str());

    CompressionType type;
    uint8_t level;
    std::string instanceId;
    unsigned int frameIndex;
    
    if (!ParseUri(type, level, instanceId, frameIndex, uri))
    {
      return false;
    }


    bool ok = false;

    Json::Value tags;
    std::auto_ptr<OrthancImageWrapper> image;

    {
        ScopedOrthancPluginMemoryBuffer dicom(context_);

        {
            BENCH(LOAD_DICOM);

            if (!GetDicomFromOrthanc(dicom.getPtr(), context_, instanceId) ||
                !GetJsonFromOrthanc(tags, context_, "/instances/" + instanceId + "/tags"))
            {
              throw Orthanc::OrthancException(Orthanc::ErrorCode_UnknownResource);
            }

            BENCH_LOG(DICOM_SIZE, dicom.getSize());
        }

        {
            BENCH(GET_FRAME_FROM_DICOM);
            image.reset(new OrthancImageWrapper(context_, OrthancPluginDecodeDicomImage(context_, dicom.getData(), dicom.getSize(), frameIndex)));
        }
    }

    Json::Value json;
    std::string compressedImage;
    {
        BENCH(COMPRESS_FRAME);

        if (GetCornerstoneMetadata(json, tags, *image))
        {
          if (type == CompressionType_Deflate)
          {
            ok = EncodeUsingDeflate(json, compressedImage, *image, 9);
          }
          else if (type == CompressionType_Jpeg)
          {
            ok = EncodeUsingJpeg(json, compressedImage, *image, level);
          }
        }

        BENCH_LOG(SIZE_IN_BYTES, json["sizeInBytes"]);
        BENCH_LOG(IMAGE_WIDTH, image->GetWidth());
        BENCH_LOG(IMAGE_HEIGHT, image->GetHeight());
    }

    if (ok)
    {
      BENCH(WRITE_REST_RESPONSE);

      Json::FastWriter writer;
      std::string jsonString = writer.write(json);

      KLVWriter klvWriter;
      klvWriter.setValue(0, jsonString.size(), jsonString.c_str());
      klvWriter.setValue(1, compressedImage.size(), compressedImage.c_str());
      content = klvWriter.write();

      return true;
    }
    else
    {
      char msg[1024];
      sprintf(msg, "Unable to decode the following instance: %s", uri.c_str());
      OrthancPluginLogWarning(context_, msg);
      return false;
    }
  }


  static bool GetStringTag(std::string& value,
                           const Json::Value& tags,
                           const std::string& tag)
  {
    if (tags.type() == Json::objectValue &&
        tags.isMember(tag) &&
        tags[tag].type() == Json::objectValue &&
        tags[tag].isMember("Type") &&
        tags[tag].isMember("Value") &&
        tags[tag]["Type"].type() == Json::stringValue &&
        tags[tag]["Value"].type() == Json::stringValue &&
        tags[tag]["Type"].asString() == "String")
    {
      value = tags[tag]["Value"].asString();
      return true;
    }        
    else
    {
      return false;
    }
  }
                                 

  static float GetFloatTag(const Json::Value& tags,
                           const std::string& tag,
                           float defaultValue)
  {
    std::string tmp;
    if (GetStringTag(tmp, tags, tag))
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
                                 


  bool DecodedImageAdapter::GetCornerstoneMetadata(Json::Value& result,
                                                   const Json::Value& tags,
                                                   OrthancImageWrapper& image)
  {
    using namespace Orthanc;

    float windowCenter, windowWidth;

    Orthanc::ImageAccessor accessor;
    accessor.AssignReadOnly(OrthancPlugins::Convert(image.GetFormat()), image.GetWidth(),
                            image.GetHeight(), image.GetPitch(), image.GetBuffer());

    switch (accessor.GetFormat())
    {
      case PixelFormat_Grayscale8:
      case PixelFormat_Grayscale16:
      case PixelFormat_SignedGrayscale16:
      {
        int64_t a, b;
        Orthanc::ImageProcessing::GetMinMaxValue(a, b, accessor);
        result["minPixelValue"] = (a < 0 ? static_cast<int32_t>(a) : 0);
        result["maxPixelValue"] = (b > 0 ? static_cast<int32_t>(b) : 1);
        result["color"] = false;
        
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
        result["minPixelValue"] = 0;
        result["maxPixelValue"] = 255;
        result["color"] = true;
        windowCenter = 127.5f;
        windowWidth = 256.0f;
        break;

      default:
        return false;
    }

    float slope = GetFloatTag(tags, "0028,1053", 1.0f);
    float intercept = GetFloatTag(tags, "0028,1052", 0.0f);

    result["slope"] = slope;
    result["intercept"] = intercept;
    result["rows"] = image.GetHeight();
    result["columns"] = image.GetWidth();
    result["height"] = image.GetHeight();
    result["width"] = image.GetWidth();

    bool ok = false;
    std::string pixelSpacing;
    if (GetStringTag(pixelSpacing, tags, "0028,0030"))
    {
      std::vector<std::string> tokens;
      Orthanc::Toolbox::TokenizeString(tokens, pixelSpacing, '\\');

      if (tokens.size() >= 2)
      {
        try
        {
          result["columnPixelSpacing"] = boost::lexical_cast<float>(Orthanc::Toolbox::StripSpaces(tokens[1]));
          result["rowPixelSpacing"] = boost::lexical_cast<float>(Orthanc::Toolbox::StripSpaces(tokens[0]));
          ok = true;
        }
        catch (boost::bad_lexical_cast&)
        {
        }
      }
    }

    if (!ok)
    {
      result["columnPixelSpacing"] = 1.0f;
      result["rowPixelSpacing"] = 1.0f;
    }

    result["windowCenter"] = GetFloatTag(tags, "0028,1050", windowCenter * slope + intercept);
    result["windowWidth"] = GetFloatTag(tags, "0028,1051", windowWidth * slope);

    return true;
  }



  bool  DecodedImageAdapter::EncodeUsingDeflate(Json::Value& jsonResult,
                                                std::string& imageResult,
                                                OrthancImageWrapper& image,
                                                uint8_t compressionLevel  /* between 0 and 9 */)
  {
    BENCH(COMPRESS_FRAME_IN_DEFLATE);

    Orthanc::ImageAccessor accessor;
    accessor.AssignReadOnly(OrthancPlugins::Convert(image.GetFormat()), image.GetWidth(),
                            image.GetHeight(), image.GetPitch(), image.GetBuffer());

    Orthanc::ImageBuffer buffer;
    buffer.SetMinimalPitchForced(true);

    Orthanc::ImageAccessor converted;

    switch (accessor.GetFormat())
    {
      case Orthanc::PixelFormat_RGB24:
        converted = accessor;
        break;

      case Orthanc::PixelFormat_Grayscale8:
      case Orthanc::PixelFormat_Grayscale16:
        buffer.SetFormat(Orthanc::PixelFormat_Grayscale16);
        buffer.SetWidth(accessor.GetWidth());
        buffer.SetHeight(accessor.GetHeight());
        converted = buffer.GetAccessor();
        Orthanc::ImageProcessing::Convert(converted, accessor);
        break;

      case Orthanc::PixelFormat_SignedGrayscale16:
        converted = accessor;
        break;

      default:
        // Unsupported pixel format
        return false;
    }

    jsonResult["Orthanc"]["IsSigned"] = (accessor.GetFormat() == Orthanc::PixelFormat_SignedGrayscale16);

    // Sanity check: The pitch must be minimal
    assert(converted.GetSize() == converted.GetWidth() * converted.GetHeight() *
           GetBytesPerPixel(converted.GetFormat()));
    jsonResult["Orthanc"]["Compression"] = "Deflate";
    jsonResult["sizeInBytes"] = converted.GetSize();

    CompressUsingDeflate(imageResult, image.GetContext(), converted.GetConstBuffer(), converted.GetSize());

    return true;
  }



  template <typename TargetType, typename SourceType>
  static void ChangeDynamics(Orthanc::ImageAccessor& target,
                             const Orthanc::ImageAccessor& source,
                             SourceType source1, TargetType target1,
                             SourceType source2, TargetType target2)
  {
    if (source.GetWidth() != target.GetWidth() ||
        source.GetHeight() != target.GetHeight())
    {
      throw Orthanc::OrthancException(Orthanc::ErrorCode_IncompatibleImageSize);
    }

    float scale = static_cast<float>(target2 - target1) / static_cast<float>(source2 - source1);
    float offset = static_cast<float>(target1) - scale * static_cast<float>(source1);

    const float minValue = static_cast<float>(std::numeric_limits<TargetType>::min());
    const float maxValue = static_cast<float>(std::numeric_limits<TargetType>::max());

    for (unsigned int y = 0; y < source.GetHeight(); y++)
    {
      const SourceType* p = reinterpret_cast<const SourceType*>(source.GetConstRow(y));
      TargetType* q = reinterpret_cast<TargetType*>(target.GetRow(y));

      for (unsigned int x = 0; x < source.GetWidth(); x++, p++, q++)
      {
        float v = (scale * static_cast<float>(*p)) + offset;

        if (v > maxValue)
        {
          *q = std::numeric_limits<TargetType>::max();
        }
        else if (v < minValue)
        {
          *q = std::numeric_limits<TargetType>::min();
        }
        else
        {
          //*q = static_cast<TargetType>(boost::math::iround(v));
          
          // http://stackoverflow.com/a/485546/881731
          *q = static_cast<TargetType>(floor(v + 0.5f));
        }
      }
    }
  }


  bool  DecodedImageAdapter::EncodeUsingJpeg(Json::Value& jsonResult,
                                             std::string& jpegResult,
                                             OrthancImageWrapper& image,
                                             uint8_t quality /* between 0 and 100 */)
  {
    BENCH(COMPRESS_FRAME_IN_JPEG);
    Orthanc::ImageAccessor accessor;
    accessor.AssignReadOnly(OrthancPlugins::Convert(image.GetFormat()), image.GetWidth(),
                            image.GetHeight(), image.GetPitch(), image.GetBuffer());

    Orthanc::ImageBuffer buffer;
    buffer.SetMinimalPitchForced(true);

    Orthanc::ImageAccessor converted;

    if (accessor.GetFormat() == Orthanc::PixelFormat_Grayscale8 ||
        accessor.GetFormat() == Orthanc::PixelFormat_RGB24)
    {
      jsonResult["Orthanc"]["Stretched"] = false;
      converted = accessor;
    }
    else if (accessor.GetFormat() == Orthanc::PixelFormat_Grayscale16 ||
             accessor.GetFormat() == Orthanc::PixelFormat_SignedGrayscale16)
    {
      jsonResult["Orthanc"]["Stretched"] = true;
      buffer.SetFormat(Orthanc::PixelFormat_Grayscale8);
      buffer.SetWidth(accessor.GetWidth());
      buffer.SetHeight(accessor.GetHeight());
      converted = buffer.GetAccessor();

      int64_t a, b;
      Orthanc::ImageProcessing::GetMinMaxValue(a, b, accessor);
      jsonResult["Orthanc"]["StretchLow"] = static_cast<int32_t>(a);
      jsonResult["Orthanc"]["StretchHigh"] = static_cast<int32_t>(b);

      if (accessor.GetFormat() == Orthanc::PixelFormat_Grayscale16)
      {
        ChangeDynamics<uint8_t, uint16_t>(converted, accessor, a, 0, b, 255);
      }
      else
      {
        ChangeDynamics<uint8_t, int16_t>(converted, accessor, a, 0, b, 255);
      }
    }
    else
    {
      return false;
    }

    jsonResult["Orthanc"]["IsSigned"] = (accessor.GetFormat() == Orthanc::PixelFormat_SignedGrayscale16);
    jsonResult["Orthanc"]["Compression"] = "Jpeg";
    jsonResult["sizeInBytes"] = converted.GetSize();

    WriteJpegToMemory(jpegResult, image.GetContext(), converted, quality);
    BENCH_LOG(COMPRESSION_JPEG_QUALITY, (int) quality);
    BENCH_LOG(COMPRESSION_JPEG_SIZE, jpegResult.size());

    return true;
  }
}
