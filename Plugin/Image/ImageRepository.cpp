#include <string>
#include <orthanc/OrthancCPlugin.h>
#include <json/writer.h>
#include <boost/lexical_cast.hpp>
#include <boost/thread/lock_guard.hpp> 
#include <boost/foreach.hpp>

#include "../../Orthanc/Core/OrthancException.h" // for throws
#include "../ViewerToolbox.h" // for OrthancPlugins::get*FromOrthanc && OrthancPluginImage
#include "../BenchmarkHelper.h" // for BENCH(*)
#include "../OrthancContextManager.h" // for context_ global

#include "ImageRepository.h"
#include "ImageContainer/RawImageContainer.h"
#include "ImageContainer/CornerstoneKLVContainer.h"
#include "ScopedBuffers.h"

namespace
{
void _loadDicomTags(Json::Value& jsonOutput, const std::string& instanceId);
void _getFrame(OrthancPluginImage** frameOutput, const void* dicomData, uint32_t dicomDataSize, uint32_t frameIndex);
std::string _getAttachmentNumber(int frameIndex, const IImageProcessingPolicy* policy);
}

ImageRepository::ImageRepository(DicomRepository* dicomRepository)
  : _cachedImageStorageEnabled(true), _dicomRepository(dicomRepository)
{
}

Image* ImageRepository::GetImage(const std::string& instanceId, uint32_t frameIndex, bool enableCache) const
{
  // @todo activate cache

  BENCH_LOG(IMAGE_FORMATING, "");
  // boost::lock_guard<boost::mutex> guard(mutex_); // make sure the memory amount doesn't overrise

  // @todo catch method call's exceptions ?

  // @todo check if it's useful. json should not be required
  // as the content is already in the dicom.
  Json::Value dicomTags;
  _loadDicomTags(dicomTags, instanceId);

  OrthancPluginMemoryBuffer dicom;
  _dicomRepository->getDicomFile(instanceId, dicom);

  OrthancPluginImage* frame = NULL;
  {
    //boost::lock_guard<boost::mutex> guard(mutex_); // check what happens if only one thread asks for frame at a time
    _getFrame(&frame, reinterpret_cast<const void*>(dicom.data), dicom.size, frameIndex);
  }

  RawImageContainer* data = new RawImageContainer(frame);
  Image* image = new Image(instanceId, frameIndex, data, dicomTags);

  _dicomRepository->decrefDicomFile(instanceId);

  return image;
}

Image* ImageRepository::_GetImage(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const {
  // create file
  Image* image = this->GetImage(instanceId, frameIndex, false);

  image->ApplyProcessing(policy);

  return image;
}

Image* ImageRepository::_GetImageFromCache(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const {
  // if not found - create
  // if found - retrieve
  Image* image;
  OrthancPluginMemoryBuffer getResultBuffer; //will be adopted by CornerstoneKLVContainer if the request succeeds
  getResultBuffer.data = NULL;

  // store attachment
  // /{resourceType}/{id}/attachments/{name}
  // -> no result
  // -> data : Unknown Resource
  // -> unregistered attachment name : inexistent item

  // Define attachment name based upon policy
  std::string attachmentName = _getAttachmentNumber(frameIndex, policy);

  // Get attachment content
  OrthancPluginErrorCode error;
  std::string path = "/instances/" + instanceId + "/attachments/" + attachmentName + "/data";
  {
    BENCH(FILE_CACHE_RETRIEVAL);
    error = OrthancPluginRestApiGet(OrthancContextManager::Get(), &getResultBuffer, path.c_str());
  }

  if (error == OrthancPluginErrorCode_InexistentItem)
  {
    assert(getResultBuffer.data == NULL); //make sure there won't be any leak since getResultBuffer is not deleted if not adopted by the KLV Container

    // @todo throw exception - attachment tag doesn't exists
    return NULL;
  }
  else if (error == OrthancPluginErrorCode_UnknownResource)
  {
    assert(getResultBuffer.data == NULL); //make sure there won't be any leak since getResultBuffer is not deleted if not adopted by the KLV Container

    // No cache available - Create content & save cache

    BENCH(FILE_CACHE_CREATION); // @todo Split in two when refactoring. This contains the file processing..
    image = _GetImage(instanceId, frameIndex, policy);

    // save file
    ScopedOrthancPluginMemoryBuffer putResultBuffer(OrthancContextManager::Get());
    path = "/instances/" + instanceId + "/attachments/" + attachmentName; // no "/data"

    // @todo avoid Orthanc throwing PluginsManager.cpp:194] Exception while invoking plugin service 3001: Unknown resource
    error = OrthancPluginRestApiPut(OrthancContextManager::Get(), putResultBuffer.getPtr(), path.c_str(), image->GetBinary(), image->GetBinarySize());
    if (error != OrthancPluginErrorCode_Success)
    {
      // @todo throw or be sure orthanc is up to date at plugin init
      // throw Orthanc::OrthancException(Orthanc::ErrorCode_UnknownResource);
      return NULL;
    }
    else
    {
      return image;
    }

  }
  else if (error == OrthancPluginErrorCode_Success)
  {
    // Cache available - send retrieved file

    // NO METADATA ?
    // unstable...
    CornerstoneKLVContainer* data = new CornerstoneKLVContainer(getResultBuffer); // takes getResultBuffer memory ownership
    image = new Image(instanceId, frameIndex, data); // takes data memory ownership
    
    return image;
  }
  else
  {
    // throw Orthanc::OrthancException(Orthanc::ErrorCode_UnknownResource);
    // @todo throw;
    return NULL;
  }
}

Image* ImageRepository::GetImage(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy, bool enableCache) const
{
  if (enableCache && isCachedImageStorageEnabled()) {
    return _GetImageFromCache(instanceId, frameIndex, policy);
  }
  else {
    return _GetImage(instanceId, frameIndex, policy);
  }

}

void ImageRepository::CleanImageCache(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const
{
  // set cache path
  std::string attachmentName = "frame:" + boost::lexical_cast<std::string>(frameIndex);
  if (policy)
  {
    attachmentName += "~" + policy->ToString();
  }
  std::string path = "/instances/" + instanceId + "/attachments/" + attachmentName;

  // send clean path request
  OrthancPluginErrorCode error;
  {
    BENCH(FILE_CACHE_CLEAN);
    error = OrthancPluginRestApiDelete(OrthancContextManager::Get(), path.c_str());
  }
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

void _getFrame(OrthancPluginImage** frameOutput, const void* dicomData, uint32_t dicomDataSize, uint32_t frameIndex)
{
  BENCH(GET_FRAME_FROM_DICOM);

  *frameOutput = OrthancPluginDecodeDicomImage(OrthancContextManager::Get(), dicomData, dicomDataSize, frameIndex);
}

std::string _getAttachmentNumber(int frameIndex, const IImageProcessingPolicy* policy)
{
  std::string attachmentNumber;
  std::string policyString = policy->ToString();
  int attachmentPrefix = 10000;
  int maxFrameCount = 1000; // @todo use adaptative maxFrameCount !

  if (policyString == "high-quality") {
    attachmentNumber = boost::lexical_cast<std::string>(attachmentPrefix + maxFrameCount * 0 + frameIndex);
  }
  else if (policyString == "medium-quality") {
    attachmentNumber = boost::lexical_cast<std::string>(attachmentPrefix + maxFrameCount * 1 + frameIndex);
  }
  else if (policyString == "low-quality") {
    attachmentNumber = boost::lexical_cast<std::string>(attachmentPrefix + maxFrameCount * 2 + frameIndex);
  }
  else {
    // @todo set better error message
    throw Orthanc::OrthancException(Orthanc::ErrorCode_UnknownResource);
  }

  return attachmentNumber;
}
}
