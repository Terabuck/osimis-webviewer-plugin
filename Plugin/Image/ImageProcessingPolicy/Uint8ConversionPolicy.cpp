#include "Uint8ConversionPolicy.h"

#include "../../Orthanc/Core/Images/ImageBuffer.h" // for ImageBuffer
#include "../../Orthanc/Core/Images/ImageProcessing.h" // for ImageProcessing::GetMinMaxValue
#include "../../Orthanc/Core/OrthancException.h"

#include "../ImageContainer/RawImageContainer.h"

#include <cmath> // for std::floor

namespace {
  template <typename TargetType, typename SourceType>
  static void ChangeDynamics(Orthanc::ImageAccessor& target,
                             const Orthanc::ImageAccessor& source,
                             SourceType source1, TargetType target1,
                             SourceType source2, TargetType target2);
}

IImageContainer* Uint8ConversionPolicy::Apply(IImageContainer* input)
{
  RawImageContainer* rawInputImage = dynamic_cast<RawImageContainer*>(input);
  if (!rawInputImage)
  {
    // @todo Throw exception : input is not a raw image
    return 0;
  }

  Orthanc::ImageAccessor* inAccessor = rawInputImage->GetOrthancImageAccessor();
  if (inAccessor->GetFormat() != Orthanc::PixelFormat_Grayscale16 &&
      inAccessor->GetFormat() != Orthanc::PixelFormat_SignedGrayscale16)
  {
    // @todo Throw exception : input is not 16bit
    // @todo do nothing if already uint8_t
    return 0;
  }

  Orthanc::ImageBuffer* outBuffer = new Orthanc::ImageBuffer;
  outBuffer->SetMinimalPitchForced(true);
  outBuffer->SetFormat(Orthanc::PixelFormat_Grayscale8);
  outBuffer->SetWidth(inAccessor->GetWidth());
  outBuffer->SetHeight(inAccessor->GetHeight());
  Orthanc::ImageAccessor outAccessor = outBuffer->GetAccessor();

  int64_t a, b;
  Orthanc::ImageProcessing::GetMinMaxValue(a, b, *inAccessor); // @todo cache this processing

  if (inAccessor->GetFormat() == Orthanc::PixelFormat_Grayscale16)
  {
    ChangeDynamics<uint8_t, uint16_t>(outAccessor, *inAccessor, a, 0, b, 255);
  }
  else
  {
    ChangeDynamics<uint8_t, int16_t>(outAccessor, *inAccessor, a, 0, b, 255);
  }

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