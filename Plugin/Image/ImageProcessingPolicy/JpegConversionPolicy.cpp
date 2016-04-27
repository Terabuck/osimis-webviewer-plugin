#include "JpegConversionPolicy.h"

#include <orthanc/OrthancCPlugin.h> // for OrthancPluginMemoryBuffer
#include "../../Orthanc/Core/Images/ImageBuffer.h"
#include "../../Orthanc/Core/OrthancException.h"
#include "../../ViewerToolbox.h" // for WriteJpegToMemory
#include "../../BenchmarkHelper.h"

#include "../ImageContainer/RawImageContainer.h"
#include "../ImageContainer/JpegImageContainer.h"
#include "../../OrthancContextManager.h"
#include "../../BenchmarkHelper.h"

JpegConversionPolicy::JpegConversionPolicy(int quality) : quality_(quality)
{
  // @todo check quality
}

JpegConversionPolicy::~JpegConversionPolicy()
{
}

IImageContainer* JpegConversionPolicy::Apply(IImageContainer* input, ImageMetaData* metaData) {
  BENCH(COMPRESS_FRAME_IN_JPEG);

  RawImageContainer* rawImage = dynamic_cast<RawImageContainer*>(input);
  if (!rawImage)
  {
    throw new std::invalid_argument("Input is not raw");
    // @todo Throw exception : input is not a raw image
    return 0;
  }

  Orthanc::ImageAccessor* accessor = rawImage->GetOrthancImageAccessor();
  Orthanc::PixelFormat pixelFormat = accessor->GetFormat();
  if (pixelFormat != Orthanc::PixelFormat_Grayscale8 && pixelFormat != Orthanc::PixelFormat_RGB24)
  {
    throw new std::invalid_argument("Input is not 8bit");
    // @todo Throw exception : input is not 8bit
    return 0;
  }

  // @note we don't use ViewerToolbox::WriteJpegToMemory because it has
  // avoidable memory copy from OrthancPluginMemoryBuffer to std::string
  // using std::string#assign(const char*, size_t);

  OrthancPluginMemoryBuffer* buffer = new OrthancPluginMemoryBuffer;

  OrthancPluginErrorCode error = OrthancPluginCompressJpegImage(
   OrthancContextManager::Get(), buffer, OrthancPlugins::Convert(accessor->GetFormat()),
   accessor->GetWidth(), accessor->GetHeight(), accessor->GetPitch(),
   accessor->GetConstBuffer(), quality_
  );

  if (error != OrthancPluginErrorCode_Success)
  {
    // @todo catch in Controller!
    // OrthancPluginErrorCode_ParameterOutOfRange mean image is not in 8bit
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(error));
  }

  BENCH_LOG(COMPRESSION_JPEG_QUALITY, (int) quality_);
  BENCH_LOG(COMPRESSION_JPEG_SIZE, buffer->size);

  metaData->compression = "Jpeg";
  
  JpegImageContainer* jpegContainer = new JpegImageContainer(buffer);

  return jpegContainer;
}
