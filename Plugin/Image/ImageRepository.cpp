#include <orthanc/OrthancCPlugin.h>
#include <json/writer.h>

#include "../../Orthanc/Core/OrthancException.h" // for throws
#include "../ViewerToolbox.h" // for OrthancPlugins::get*FromOrthanc && OrthancPluginImage
#include "../BenchmarkHelper.h" // for BENCH(*)
#include "../OrthancContextManager.h" // for context_ global

#include "ImageRepository.h"
#include "ImageContainer/RawImageContainer.h"

namespace
{
  void _loadJSON(Json::Value& jsonOutput, const std::string& instanceId);
  void _loadDICOM(OrthancPluginMemoryBuffer* dicomOutput, const std::string& instanceId);
  void _getFrame(OrthancPluginImage** frameOutput, const void* dicomData, uint32_t dicomDataSize, uint32_t frameIndex);
}

Image* ImageRepository::GetImage(const std::string& instanceId, uint32_t frameIndex) const
{
  // @todo catch both method's exceptions ?

  // @todo check if it's useful. json should not be required
  // as the content is already in the dicom.
  Json::Value json;
  _loadJSON(json, instanceId);

  OrthancPluginMemoryBuffer dicom;
  _loadDICOM(&dicom, instanceId);

  OrthancPluginImage* frame = 0;
  _getFrame(&frame, reinterpret_cast<const void*>(dicom.data), dicom.size, frameIndex);
  OrthancPluginFreeMemoryBuffer(OrthancContextManager::Get(), &dicom);

  RawImageContainer* data = new RawImageContainer(frame);
  Image* image = new Image(instanceId, frameIndex, data);

  return image;
}

Image* ImageRepository::GetImage(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const {
  Image* image = this->GetImage(instanceId, frameIndex);

  image->ApplyProcessing(policy);

  // @todo compress

  // @todo write KLV

  return image;
}

namespace
{
  using namespace OrthancPlugins;

  void _loadJSON(Json::Value& jsonOutput, const std::string& instanceId)
  {
    BENCH(LOAD_JSON);
    if (!GetJsonFromOrthanc(jsonOutput, OrthancContextManager::Get(), "/instances/" + instanceId + "/tags")) {
      throw Orthanc::OrthancException(Orthanc::ErrorCode_UnknownResource);
    }
  }

  void _loadDICOM(OrthancPluginMemoryBuffer* dicomOutput, const std::string& instanceId)
  {
    BENCH(LOAD_DICOM);
    if (!GetDicomFromOrthanc(dicomOutput, OrthancContextManager::Get(), instanceId)) {
      throw Orthanc::OrthancException(Orthanc::ErrorCode_UnknownResource);
    }
    BENCH_LOG(DICOM_SIZE, dicomOutput->size);
  }

  void _getFrame(OrthancPluginImage** frameOutput, const void* dicomData, uint32_t dicomDataSize, uint32_t frameIndex)
  {
    BENCH(GET_FRAME_FROM_DICOM);

    *frameOutput = OrthancPluginDecodeDicomImage(OrthancContextManager::Get(), dicomData, dicomDataSize, frameIndex);
  }
}
