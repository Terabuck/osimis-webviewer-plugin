#include "SeriesRepository.h"

#include <memory>
#include <string>
#include <json/value.h>
#include <boost/scope_exit.hpp>
#include <boost/pointer_cast.hpp>
#include "../../Orthanc/Core/OrthancException.h"
#include "../../Orthanc/Core/DicomFormat/DicomMap.h"

#include "../OrthancContextManager.h"
#include "../Image/AvailableQuality/OnTheFlyDownloadAvailableQualityPolicy.h"
#include "ViewerToolbox.h"

SeriesRepository::SeriesRepository(DicomRepository* dicomRepository)
  : _dicomRepository(dicomRepository), _seriesFactory(std::auto_ptr<IAvailableQualityPolicy>(new OnTheFlyDownloadAvailableQualityPolicy))
{
}

std::auto_ptr<Series> SeriesRepository::GetSeries(const std::string& seriesId) {
  OrthancPluginContext* context = OrthancContextManager::Get();
  
  // Retrieve series' slices (instances & frames)
  Json::Value orderedSlices;
  if (!OrthancPlugins::GetJsonFromOrthanc(orderedSlices, context, "/series/" + seriesId + "/ordered-slices"))
  {
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_InexistentItem));
  }

  // Retrieve middle instance id
  Json::Value slicesShort = orderedSlices["SlicesShort"];
  int instanceCount = slicesShort.size();
  std::string instanceId = slicesShort[instanceCount / 2][0].asString();

  // Get instance's dicom file
  OrthancPluginMemoryBuffer dicom; // no need to free - memory managed by dicomRepository
  _dicomRepository->getDicomFile(instanceId, dicom);

  // Clean dicom file (at scope end)
  BOOST_SCOPE_EXIT(_dicomRepository, &instanceId) {
    _dicomRepository->decrefDicomFile(instanceId);
  } BOOST_SCOPE_EXIT_END;

  // Get instance's tags (the DICOM meta-informations)
  Orthanc::DicomMap tags1;
  if (!Orthanc::DicomMap::ParseDicomMetaInformation(tags1, reinterpret_cast<const char*>(dicom.data), dicom.size))
  {
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_CorruptedFile));
  }

  // Get instance's tags (the other tags)
  Json::Value tags2;
  if (!OrthancPlugins::GetJsonFromOrthanc(tags2, context, "/instances/" + instanceId + "/simplified-tags"))
  {
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_InexistentItem));
  }

  // Create a series based on tags and ordered instances
  return std::auto_ptr<Series>(_seriesFactory.CreateSeries(seriesId, slicesShort, tags1, tags2));
}