#include "SeriesRepository.h"

#include <string>
#include <json/value.h>
#include <boost/scope_exit.hpp>
#include "../../Orthanc/Core/OrthancException.h"
#include "../../Orthanc/Core/DicomFormat/DicomMap.h"

#include "../OrthancContextManager.h"
#include "../Image/AvailableQuality/OnTheFlyDownloadAvailableQualityPolicy.h"
#include "ViewerToolbox.h"

SeriesRepository::SeriesRepository(DicomRepository* dicomRepository)
  : _dicomRepository(dicomRepository), _seriesFactory(new OnTheFlyDownloadAvailableQualityPolicy(dicomRepository))
{
}

Series* SeriesRepository::GetSeries(const std::string& seriesId) {
  OrthancPluginContext* context = OrthancContextManager::Get();
  
  // Retrieve series' slices (instances & frames)
  Json::Value orderedSlices;
  if (!OrthancPlugins::GetJsonFromOrthanc(orderedSlices, context, "/series/" + seriesId + "/ordered-slices")) {
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_InexistentItem));
  }

  // Retrieve middle instance id
  Json::Value slicesShort = orderedSlices["SlicesShort"];
  int instanceCount = slicesShort.size();
  std::string instanceId = slicesShort[instanceCount / 2][0].asString();

  // Get instance's dicom file
  OrthancPluginMemoryBuffer dicom; // no need to free - memory managed by dicomRepository
  if (!_dicomRepository->getDicomFile(instanceId, dicom)) {
    // Make sure there won't be any leak
    assert(dicom.data == NULL);

    // @warning File not found - incoherent db state, ordered-slices tells it exists ! (may also be due to rare mutual access to db).
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_InexistentItem));
  }

  // Clean dicom file (at scope end)
  BOOST_SCOPE_EXIT(_dicomRepository, &instanceId) {
    _dicomRepository->decrefDicomFile(instanceId);
  } BOOST_SCOPE_EXIT_END;

  // Get instance's tags
  Orthanc::DicomMap tags;
  if (!Orthanc::DicomMap::ParseDicomMetaInformation(tags, reinterpret_cast<const char*>(dicom.data), dicom.size))
  {
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_CorruptedFile));
  }

  // Create a series based on tags and ordered instances
  Series* series = _seriesFactory.CreateSeries(seriesId, slicesShort, tags);

  return series;
}