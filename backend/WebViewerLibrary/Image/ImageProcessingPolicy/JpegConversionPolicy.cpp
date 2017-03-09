#include "JpegConversionPolicy.h"

#include <orthanc/OrthancCPlugin.h> // for OrthancPluginMemoryBuffer
#include <Core/Images/ImageBuffer.h>
#include <Core/OrthancException.h>
#include "../../Logging.h"
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

std::auto_ptr<IImageContainer> JpegConversionPolicy::Apply(std::auto_ptr<IImageContainer> input, ImageMetaData* metaData) {
  BENCH(COMPRESS_FRAME_IN_JPEG);
  OrthancPluginLogDebug(OrthancContextManager::Get(), "ImageProcessingPolicy: JpegConversionPolicy");

  // Except *raw* image
  RawImageContainer* rawImage = dynamic_cast<RawImageContainer*>(input.get());
  assert(rawImage != NULL);

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

  metaData->compression = "jpeg";
  
  return std::auto_ptr<IImageContainer>(new CompressedImageContainer(buffer));
}
