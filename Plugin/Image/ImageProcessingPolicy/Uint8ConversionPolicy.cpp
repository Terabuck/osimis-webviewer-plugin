#include "Uint8ConversionPolicy.h"

#include "../../Orthanc/Core/Images/ImageBuffer.h" // for ImageBuffer
#include "../../Orthanc/Core/Images/ImageProcessing.h" // for ImageProcessing::GetMinMaxValue
#include "../../Orthanc/Core/OrthancException.h"
#include "../../BenchmarkHelper.h"

#include "../ImageContainer/RawImageContainer.h"


#include <cmath> // for std::floor

namespace {
  template <typename TargetType, typename SourceType>
  static void ChangeDynamics(Orthanc::ImageAccessor& target,
                             const Orthanc::ImageAccessor& source,
                             SourceType source1, TargetType target1,
                             SourceType source2, TargetType target2);
}

IImageContainer* Uint8ConversionPolicy::Apply(IImageContainer* input, ImageMetaData* metaData)
{
  RawImageContainer* rawInputImage = dynamic_cast<RawImageContainer*>(input);
  if (!rawInputImage)
  {
    throw new std::invalid_argument("Input is not raw");
    // @todo Throw exception : input is not a raw image
    return NULL;
  }

  Orthanc::ImageAccessor* inAccessor = rawInputImage->GetOrthancImageAccessor();
  Orthanc::PixelFormat pixelFormat = inAccessor->GetFormat();

  if (pixelFormat == Orthanc::PixelFormat_Grayscale8 || pixelFormat == Orthanc::PixelFormat_RGB24)
  {
    // @todo OUT OF THE POLICY !
    // already Uint8 or RGB24 (uint8 * 3)
    return input;
  }

  if (pixelFormat != Orthanc::PixelFormat_Grayscale16 &&
      pixelFormat != Orthanc::PixelFormat_SignedGrayscale16)
  {
    throw new std::invalid_argument("Input is not 16bit");
    // @todo Throw exception : input is not 16bit
    // @todo do nothing if already uint8_t
    return 0;
  }

  BENCH(CONVERT_TO_UINT8);

  Orthanc::ImageBuffer* outBuffer = new Orthanc::ImageBuffer;
  outBuffer->SetMinimalPitchForced(true);
  outBuffer->SetFormat(Orthanc::PixelFormat_Grayscale8);
  outBuffer->SetWidth(inAccessor->GetWidth());
  outBuffer->SetHeight(inAccessor->GetHeight());
  Orthanc::ImageAccessor outAccessor = outBuffer->GetAccessor();

  if (pixelFormat == Orthanc::PixelFormat_Grayscale16)
  {
    ChangeDynamics<uint8_t, uint16_t>(outAccessor, *inAccessor, metaData->minPixelValue, 0, metaData->maxPixelValue, 255);
  }
  else
  {
    ChangeDynamics<uint8_t, int16_t>(outAccessor, *inAccessor, metaData->minPixelValue, 0, metaData->maxPixelValue, 255);
  }

  metaData->stretched = true;
  metaData->sizeInBytes = outAccessor.GetSize();
  
  BENCH_LOG(SIZE_IN_BYTES, metaData->sizeInBytes);

  RawImageContainer* rawOutputImage = new RawImageContainer(outBuffer);
  return rawOutputImage;
}

namespace {
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
          *q = static_cast<TargetType>(std::floor(v + 0.5f));
        }
      }
    }
  }
}
