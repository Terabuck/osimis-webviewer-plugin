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

  RawImageContainer* rawImage = dynamic_cast<RawImageContainer*>(input);
  if (!rawImage)
  {
    throw new std::invalid_argument("Input is not raw");
    // @todo Throw exception : input is not a raw image
    return 0;
  }

  Orthanc::ImageAccessor* accessor = rawImage->GetOrthancImageAccessor();

  OrthancPluginMemoryBuffer* buffer = new OrthancPluginMemoryBuffer;
  // @todo test with 8bit images

  OrthancPluginErrorCode error = OrthancPluginCompressPngImage(
   OrthancContextManager::Get(), buffer, OrthancPlugins::Convert(accessor->GetFormat()),
   accessor->GetWidth(), accessor->GetHeight(), accessor->GetPitch(),
   accessor->GetConstBuffer()
  );

  if (error != OrthancPluginErrorCode_Success)
  {
    // @todo catch in Controller!
    // OrthancPluginErrorCode_ParameterOutOfRange mean image is not the right format (xBit ?)
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(error));
  }

  BENCH_LOG(COMPRESSION_PNG_SIZE, buffer->size);

  metaData->compression = "Png";
  
  CompressedImageContainer* jpegContainer = new CompressedImageContainer(buffer);

  return jpegContainer;
}