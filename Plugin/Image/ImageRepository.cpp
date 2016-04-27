#include <string>
#include <orthanc/OrthancCPlugin.h>
#include <json/writer.h>
#include <boost/lexical_cast.hpp>
#include <boost/thread/lock_guard.hpp> 

#include "../../Orthanc/Core/OrthancException.h" // for throws
#include "../ViewerToolbox.h" // for OrthancPlugins::get*FromOrthanc && OrthancPluginImage
#include "../BenchmarkHelper.h" // for BENCH(*)
#include "../OrthancContextManager.h" // for context_ global

#include "ImageRepository.h"
#include "ImageContainer/RawImageContainer.h"
#include "ImageContainer/CornerstoneKLVContainer.h"

namespace
{
  void _loadDicomTags(Json::Value& jsonOutput, const std::string& instanceId);
  void _loadDICOM(OrthancPluginMemoryBuffer* dicomOutput, const std::string& instanceId);
  void _getFrame(OrthancPluginImage** frameOutput, const void* dicomData, uint32_t dicomDataSize, uint32_t frameIndex);
}

Image* ImageRepository::GetImage(const std::string& instanceId, uint32_t frameIndex) const
{
  BENCH_LOG(IMAGE_FORMATING, "");
  boost::lock_guard<boost::mutex> guard(mutex_); // make sure the memory amount doesn't overrise 

  // @todo catch method call's exceptions ?

  // @todo check if it's useful. json should not be required
  // as the content is already in the dicom.
  Json::Value dicomTags;
  _loadDicomTags(dicomTags, instanceId);

  OrthancPluginMemoryBuffer dicom;
  _loadDICOM(&dicom, instanceId);

  OrthancPluginImage* frame = 0;
  _getFrame(&frame, reinterpret_cast<const void*>(dicom.data), dicom.size, frameIndex);
  OrthancPluginFreeMemoryBuffer(OrthancContextManager::Get(), &dicom);

  RawImageContainer* data = new RawImageContainer(frame);
  Image* image = new Image(instanceId, frameIndex, data, dicomTags);

  return image;
}

Image* ImageRepository::GetImage(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const
{

  // check attachments/test

  // if not found - create
  // if found - retrieve
  Image* image;
  OrthancPluginMemoryBuffer *getResultBuffer = new OrthancPluginMemoryBuffer;

  // store attachment
  // /{resourceType}/{id}/attachments/{name}
  // -> no result
  // -> data Unknown Resource
  // -> fale attachment name : inexistent item

  std::string attachmentName = "frame:" + boost::lexical_cast<std::string>(frameIndex) + '~' + policy->ToString();
  std::string path = "/instances/" + instanceId + "/attachments/" + attachmentName + "/data";
  // - add frame index
  // - add policies options

  // std::string path = "/instances/" + instanceId + "/attachments/" + "frame_" + boost::lexical_cast<std::string>(frameIndex) + "_policy_x";

  OrthancPluginErrorCode error;

  {
    BENCH(FILE_CACHE_RETRIEVAL);
    error = OrthancPluginRestApiGet(OrthancContextManager::Get(), getResultBuffer, path.c_str());
  }

  if (error == OrthancPluginErrorCode_InexistentItem)
  {
    // attachment tag doesn't exists
    return 0;
  }
  else if (error == OrthancPluginErrorCode_UnknownResource)
  {
    BENCH(FILE_CACHE_CREATION);
    // create file
    Image* image = this->GetImage(instanceId, frameIndex);

    image->ApplyProcessing(policy);

    // save file
    OrthancPluginMemoryBuffer putResultBuffer;
    path = "/instances/" + instanceId + "/attachments/" + attachmentName; // no "/data"

    // @todo avoid Orthanc throwing PluginsManager.cpp:194] Exception while invoking plugin service 3001: Unknown resource
    error = OrthancPluginRestApiPut(OrthancContextManager::Get(), &putResultBuffer, path.c_str(), image->GetBinary(), image->GetBinarySize());
    if (error != OrthancPluginErrorCode_Success)
    {
      // @todo throw or be sure orthanc is up to date at plugin init
      // throw new Orthanc::OrthancException(Orthanc::ErrorCode_UnknownResource);
      return 0;
    }
    else
    {
      OrthancPluginFreeMemoryBuffer(OrthancContextManager::Get(), &putResultBuffer);

      return image;
    }
  }
  else if (error == OrthancPluginErrorCode_Success)
  {
    // send retrieved file

    // issue: buffer doesn't go well with the rest

    // NO METADATA ?
    // unstable...
    CornerstoneKLVContainer* data = new CornerstoneKLVContainer(getResultBuffer); // takes getResultBuffer memory ownership
    image = new Image(instanceId, frameIndex, data); // takes data memory ownership
    
    return image;
  }
  else 
  {
    // throw new Orthanc::OrthancException(Orthanc::ErrorCode_UnknownResource);
    // @todo throw;
    return 0;
  }

    // @todo clear buffer
  // clear buffer
}


namespace
{
  using namespace OrthancPlugins;

  void _loadDicomTags(Json::Value& jsonOutput, const std::string& instanceId)
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
