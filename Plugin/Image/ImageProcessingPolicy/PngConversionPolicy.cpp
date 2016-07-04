#include "PngConversionPolicy.h"

#include <orthanc/OrthancCPlugin.h> // for OrthancPluginMemoryBuffer & OrthancPluginCompressPngImage
#include "../../Orthanc/Core/Images/ImageBuffer.h"
#include "../../Orthanc/Core/OrthancException.h"
#include "../../BenchmarkHelper.h"

#include "../ImageContainer/RawImageContainer.h"
#include "../ImageContainer/CompressedImageContainer.h"
#include "../../OrthancContextManager.h"
#include "../../BenchmarkHelper.h"

IImageContainer* PngConversionPolicy::Apply(IImageContainer* input, ImageMetaData* metaData) {
  BENCH(COMPRESS_FRAME_IN_PNG);

  // Except *raw* image
  RawImageContainer* rawImage = dynamic_cast<RawImageContainer*>(input);
  assert(rawImage != 0);

  Orthanc::ImageAccessor* accessor = rawImage->GetOrthancImageAccessor();

  OrthancPluginMemoryBuffer buffer; // will be adopted by the CompressedImageContainer so, no need to delete it

  OrthancPluginErrorCode error = OrthancPluginCompressPngImage(
   OrthancContextManager::Get(), &buffer, OrthancPlugins::Convert(accessor->GetFormat()),
   accessor->GetWidth(), accessor->GetHeight(), accessor->GetPitch(),
   accessor->GetConstBuffer()
  );

  // Except 8bit image (OrthancPluginErrorCode_ParameterOutOfRange means image is not the right format)
  assert(error != OrthancPluginErrorCode_ParameterOutOfRange);

  // Check compression result (may throw on bad_alloc)
  if (error != OrthancPluginErrorCode_Success)
  {
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(error));
  }

  BENCH_LOG(COMPRESSION_PNG_SIZE, buffer.size);

  metaData->compression = "Png";
  
  return new CompressedImageContainer(buffer);
}
