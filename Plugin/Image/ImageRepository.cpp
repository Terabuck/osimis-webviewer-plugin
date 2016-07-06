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


Image* ImageRepository::GetImage(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy, bool enableCache) const
{
  // Return uncached image
  if (!enableCache || !isCachedImageStorageEnabled()) {
    return this->_LoadImage(instanceId, frameIndex, policy);
  }
  // Return cached image (& save in cache if uncached)
  else {
    // Define attachment name based upon policy
    std::string attachmentNumber = _getAttachmentNumber(frameIndex, policy);

    // Retrieve cached image
    Image* image = this->_GetProcessedImageFromCache(attachmentNumber, instanceId, frameIndex);
    
    // Load & cache image if not found
    if (image == 0) {
      // Load image
      image = this->_LoadImage(instanceId, frameIndex, policy);

      // Cache image
      this->_CacheProcessedImage(attachmentNumber, image);
    }

    // Return image
    return image;
  }

}

void ImageRepository::CleanImageCache(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const
{
  // set cache path
  std::string attachmentNumber = _getAttachmentNumber(frameIndex, policy);
  std::string path = "/instances/" + instanceId + "/attachments/" + attachmentNumber;

  // send clean path request
  OrthancPluginErrorCode error;
  {
    BENCH(FILE_CACHE_CLEAN);
    error = OrthancPluginRestApiDelete(OrthancContextManager::Get(), path.c_str());
    // @todo manage error
  }
}

Image* ImageRepository::_LoadImage(const std::string& instanceId, uint32_t frameIndex, IImageProcessingPolicy* policy) const {
  BENCH_LOG(IMAGE_FORMATING, "");
  // boost::lock_guard<boost::mutex> guard(mutex_); // make sure the memory amount doesn't overrise

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

  // @todo call on exception
  _dicomRepository->decrefDicomFile(instanceId);

  if (policy != 0) {
    image->ApplyProcessing(policy);
  }

  return image;
}

Image* ImageRepository::_GetProcessedImageFromCache(const std::string &attachmentNumber, const std::string& instanceId, uint32_t frameIndex) const {
  // if not found - create
  // if found - retrieve
  OrthancPluginMemoryBuffer getResultBuffer; // will be adopted by CornerstoneKLVContainer if the request succeeds
  getResultBuffer.data = NULL;

  // store attachment
  // /{resourceType}/{id}/attachments/{name}
  // -> no result
  // -> data : Unknown Resource
  // -> unregistered attachment name : inexistent item

  // Get attachment content
  OrthancPluginErrorCode error;
  std::string path = "/instances/" + instanceId + "/attachments/" + attachmentNumber + "/data";
  {
    BENCH(FILE_CACHE_RETRIEVAL);
    error = OrthancPluginRestApiGet(OrthancContextManager::Get(), &getResultBuffer, path.c_str());
  }

  // Except Orthanc to accept attachmentNumber (it should be a number > 1024)
  assert(error != OrthancPluginErrorCode_InexistentItem);

  // Cache available - send retrieved file
  if (error == OrthancPluginErrorCode_Success)
  {
    // NO METADATA ?
    // unstable...
    CornerstoneKLVContainer* data = new CornerstoneKLVContainer(getResultBuffer); // takes getResultBuffer memory ownership
    Image* image = new Image(instanceId, frameIndex, data); // takes data memory ownership
    
    return image;
  }
  // No cache available
  else if (error == OrthancPluginErrorCode_UnknownResource) {
    // Make sure there won't be any leak since getResultBuffer is not deleted if not adopted by the KLV Container
    assert(getResultBuffer.data == NULL);
    return 0;
  }
  // Unknown error - throw
  else
  {
    // Make sure there won't be any leak since getResultBuffer is not deleted if not adopted by the KLV Container
    assert(getResultBuffer.data == NULL);
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(error));
  }
}

void ImageRepository::_CacheProcessedImage(const std::string &attachmentNumber, const Image* image) const {
  // Create content & save cache
  BENCH(FILE_CACHE_CREATION);

  // Save file
  ScopedOrthancPluginMemoryBuffer putResultBuffer(OrthancContextManager::Get());
  std::string path = "/instances/" + image->GetId() + "/attachments/" + attachmentNumber; // no "/data"
  // @todo avoid Orthanc throwing PluginsManager.cpp:194] Exception while invoking plugin service 3001: Unknown resource
  OrthancPluginErrorCode error = OrthancPluginRestApiPut(OrthancContextManager::Get(), putResultBuffer.getPtr(), path.c_str(), image->GetBinary(), image->GetBinarySize());

  // Throw exception on error
  if (error != OrthancPluginErrorCode_Success) {
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(error));
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
  assert(policy != 0);

  std::string attachmentNumber;
  std::string policyString = policy->ToString();
  int attachmentPrefix = 10000;
  int maxFrameCount = 1000; // @todo use adaptative maxFrameCount !

  // Except to cache only specified policies
  assert(policyString == "pixeldata-quality" || policyString == "high-quality" || policyString == "medium-quality" ||
         policyString == "low-quality");

  if (policyString == "pixeldata-quality") {
    attachmentNumber = boost::lexical_cast<std::string>(attachmentPrefix + maxFrameCount * 3 + frameIndex);
  }
  else if (policyString == "high-quality") {
    attachmentNumber = boost::lexical_cast<std::string>(attachmentPrefix + maxFrameCount * 0 + frameIndex);
  }
  else if (policyString == "medium-quality") {
    attachmentNumber = boost::lexical_cast<std::string>(attachmentPrefix + maxFrameCount * 1 + frameIndex);
  }
  else if (policyString == "low-quality") {
    attachmentNumber = boost::lexical_cast<std::string>(attachmentPrefix + maxFrameCount * 2 + frameIndex);
  }

  return attachmentNumber;
}
}
