#include "SeriesRepository.h"

#include <memory>
#include <string>
#include <json/value.h>
#include <boost/scope_exit.hpp>
#include <boost/pointer_cast.hpp>
#include <Core/OrthancException.h>
#include <Core/DicomFormat/DicomMap.h>

#include "../OrthancContextManager.h"
#include "../BenchmarkHelper.h"
#include "../Image/AvailableQuality/OnTheFlyDownloadAvailableQualityPolicy.h"
#include "ViewerToolbox.h"

namespace {
  bool _isDicomSr(const Json::Value &tags);
}

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

  // Get each instance's tags (to avoid an additional request at each series' images)
  const Json::Value &slicesShort = orderedSlices["SlicesShort"];
  Json::Value instancesTags;
  {
    BENCH(RETRIEVE_ALL_INSTANCES_TAGS)
    for(Json::ValueIterator itr = slicesShort.begin(); itr != slicesShort.end(); itr++) {
      std::string instanceId = (*itr)[0].asString();

      Json::Value instanceTags;
      if (!OrthancPlugins::GetJsonFromOrthanc(instanceTags, context, "/instances/" + instanceId + "/simplified-tags"))
      {
        throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_InexistentItem));
      }

      instancesTags[instanceId] = instanceTags;
    }
  }

  // Retrieve middle instance id
  int instanceCount = slicesShort.size();
  std::string middleInstanceId = slicesShort[instanceCount / 2][0].asString();

  // Get middle instance's dicom file
  OrthancPluginMemoryBuffer dicom; // no need to free - memory managed by dicomRepository
  _dicomRepository->getDicomFile(middleInstanceId, dicom);

  // Clean middle instance's dicom file (at scope end)
  BOOST_SCOPE_EXIT(_dicomRepository, &middleInstanceId) {
    _dicomRepository->decrefDicomFile(middleInstanceId);
  } BOOST_SCOPE_EXIT_END;

  // Get middle instance's tags (the DICOM meta-informations)
  Orthanc::DicomMap tags1;
  if (!Orthanc::DicomMap::ParseDicomMetaInformation(tags1, reinterpret_cast<const char*>(dicom.data), dicom.size))
  {
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_CorruptedFile));
  }

  // Get middle instance's tags (the other tags)
  const Json::Value& tags2 = instancesTags[middleInstanceId];

  // Ignore DICOM SR files (they can't be processed by our SeriesFactory)
  // Note this line is only here to provide better error message, also
  // @warning We make the assumption DICOM SR are always a single alone instance
  //          contained within a separate series.
  if (::_isDicomSr(tags2)) {
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_IncompatibleImageFormat));
  }
  
  // Create a series based on tags and ordered instances
  return std::auto_ptr<Series>(_seriesFactory.CreateSeries(seriesId, slicesShort, tags1, tags2, instancesTags));
}

namespace {
  bool _isDicomSr(const Json::Value &tags) {
    if (tags["Modality"].empty()) {
      return false;
    }

    std::string modality = tags["Modality"].asString();

    return (modality == "SR");
  }
}