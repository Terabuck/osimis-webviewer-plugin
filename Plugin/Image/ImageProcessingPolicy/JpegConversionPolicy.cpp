#include "JpegConversionPolicy.h"

#include <orthanc/OrthancCPlugin.h> // for OrthancPluginMemoryBuffer
#include "../../Orthanc/Core/Images/ImageBuffer.h"
#include "../../Orthanc/Core/OrthancException.h"
#include "../../BenchmarkHelper.h"

#include "../ImageContainer/RawImageContainer.h"
#include "../ImageContainer/CompressedImageContainer.h"
#include "../../OrthancContextManager.h"
#include "../../BenchmarkHelper.h"

JpegConversionPolicy::JpegConversionPolicy(int quality) : quality_(quality)
{
  assert(quality <= 100);
}

JpegConversionPolicy::~JpegConversionPolicy()
{
}

IImageContainer* JpegConversionPolicy::Apply(IImageContainer* input, ImageMetaData* metaData) {
  BENCH(COMPRESS_FRAME_IN_JPEG);

  // Except *raw* image
  RawImageContainer* rawImage = dynamic_cast<RawImageContainer*>(input);
  assert(rawImage != 0);

  Orthanc::ImageAccessor* accessor = rawImage->GetOrthancImageAccessor();

  // @note we don't use ViewerToolbox::WriteJpegToMemory because it has
  // avoidable memory copy from OrthancPluginMemoryBuffer to std::string
  // using std::string#assign(const char*, size_t);

  OrthancPluginMemoryBuffer buffer; //will be adopted by the CompressedImageContainer so, no need to delete it

  OrthancPluginErrorCode error = OrthancPluginCompressJpegImage(
   OrthancContextManager::Get(), &buffer, OrthancPlugins::Convert(accessor->GetFormat()),
   accessor->GetWidth(), accessor->GetHeight(), accessor->GetPitch(),
   accessor->GetConstBuffer(), quality_
  );

  // Except 8bit image (OrthancPluginErrorCode_ParameterOutOfRange means image is not the right format)
  assert(error != OrthancPluginErrorCode_ParameterOutOfRange);

  // Check compression result (may throw on bad_alloc)
  if (error != OrthancPluginErrorCode_Success)
  {
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(error));
  }

  BENCH_LOG(COMPRESSION_JPEG_QUALITY, (int) quality_);
  BENCH_LOG(COMPRESSION_JPEG_SIZE, buffer.size);

  metaData->compression = "Jpeg";
  
  return new CompressedImageContainer(buffer);
}
