#include "SeriesRepository.h"

#include <memory>
#include <string>
#include <json/value.h>
#include <boost/scope_exit.hpp>
#include <boost/pointer_cast.hpp>
#include <Core/OrthancException.h>
#include <Core/DicomFormat/DicomMap.h> // To retrieve transfer syntax
#include <Core/Toolbox.h> // For _getTransferSyntax -> Orthanc::Toolbox::StripSpaces

#include "../OrthancContextManager.h"
#include "../BenchmarkHelper.h"
#include "../Image/AvailableQuality/OnTheFlyDownloadAvailableQualityPolicy.h"
#include "ViewerToolbox.h"

namespace {
  std::string _getTransferSyntax(const Orthanc::DicomMap& headerTags);
  bool _isDicomSr(const Json::Value &tags);
  bool _isDicomPr(const Json::Value &tags);
  Json::Value simplifyInstanceTags(const Json::Value& instanceTags);
}

SeriesRepository::SeriesRepository(DicomRepository* dicomRepository)
  : _dicomRepository(dicomRepository), _seriesFactory(std::auto_ptr<IAvailableQualityPolicy>(new OnTheFlyDownloadAvailableQualityPolicy))
{
}

std::auto_ptr<Series> SeriesRepository::GetSeries(const std::string& seriesId, bool getInstanceTags) {
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

  // Retrieve middle instance id
  int instanceCount = slicesShort.size();
  std::string middleInstanceId = slicesShort[instanceCount / 2][0].asString();

  if (getInstanceTags)
  {
    BENCH(RETRIEVE_ALL_INSTANCES_TAGS)
    for(Json::ValueIterator itr = slicesShort.begin(); itr != slicesShort.end(); itr++) {
      std::string instanceId = (*itr)[0].asString();

      Json::Value instanceTags;
      if (!OrthancPlugins::GetJsonFromOrthanc(instanceTags, context, "/instances/" + instanceId + "/simplified-tags"))
      {
        throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_InexistentItem));
      }

      instancesTags[instanceId] = simplifyInstanceTags(instanceTags);
    }
  }
  else
  {// only get the middle instance tags
    Json::Value instanceTags;
    if (!OrthancPlugins::GetJsonFromOrthanc(instanceTags, context, "/instances/" + middleInstanceId + "/simplified-tags"))
    {
      throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_InexistentItem));
    }
    instancesTags[middleInstanceId] = simplifyInstanceTags(instanceTags);
  }


  // Get middle instance's dicom file
  OrthancPluginMemoryBuffer dicom; // no need to free - memory managed by dicomRepository
  _dicomRepository->getDicomFile(middleInstanceId, dicom);

  // Clean middle instance's dicom file (at scope end)
  BOOST_SCOPE_EXIT(_dicomRepository, &middleInstanceId) {
    _dicomRepository->decrefDicomFile(middleInstanceId);
  } BOOST_SCOPE_EXIT_END;

  // Get middle instance's tags (the DICOM meta-informations)
  Orthanc::DicomMap dicomMapToFillTags1;
  Json::Value tags1;
  if (!Orthanc::DicomMap::ParseDicomMetaInformation(dicomMapToFillTags1, reinterpret_cast<const char*>(dicom.data), dicom.size))
  {
    // Consider implicit VR if `ParseDicomMetaInformation` has failed (it fails
    // because `DICM` header at [128..131] is not present in the DICOM instance  
    // binary file). In our tests, while being visible in some other viewers,
    // those files didn't have any TransferSyntax either.
    tags1["TransferSyntax"] = "1.2.840.10008.1.2";
  }
  else {
    tags1["TransferSyntax"] = _getTransferSyntax(dicomMapToFillTags1);
  }

  // Get middle instance's tags (the other tags)
  const Json::Value& tags2 = instancesTags[middleInstanceId];

  // Ignore DICOM SR (DICOM report) and PR (DICOM Presentation State, which are
  // `views` referencing other instances) files (they can't be processed by our
  // SeriesFactory) Note this line is only here to provide better error
  // message, also
  // @warning We make the assumption DICOM SR & PR are always a single alone
  //          instance contained within a separate series.
  if (::_isDicomSr(tags2) || ::_isDicomPr(tags2)) {
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_IncompatibleImageFormat));
  }
  
  // Create a series based on tags and ordered instances
  return std::auto_ptr<Series>(_seriesFactory.CreateSeries(seriesId, slicesShort, tags1, tags2, instancesTags));
}

namespace {
  std::string _getTransferSyntax(const Orthanc::DicomMap& headerTags)
  {
    using namespace Orthanc;

    // Retrieve transfer syntax
    const DicomValue* transfertSyntaxValue = headerTags.TestAndGetValue(0x0002, 0x0010);
    std::string transferSyntax;

    if (transfertSyntaxValue->IsBinary()) {
      throw OrthancException(ErrorCode::ErrorCode_CorruptedFile);
    }
    else if (transfertSyntaxValue == NULL || transfertSyntaxValue->IsNull()) {
      // Set default transfer syntax if not found
      transferSyntax = "1.2.840.10008.1.2";
    }
    else {
      // Stripping spaces should not be required, as this is a UI value
      // representation whose stripping is supported by the Orthanc
      // core, but let's be careful...
      transferSyntax = Orthanc::Toolbox::StripSpaces(transfertSyntaxValue->GetContent());
    }

    return transferSyntax;
  }

  bool _isDicomSr(const Json::Value &tags) {
    if (tags["Modality"].empty()) {
      return false;
    }

    std::string modality = tags["Modality"].asString();

    return (modality == "SR");
  }

  bool _isDicomPr(const Json::Value &tags) {
    if (tags["Modality"].empty()) {
      return false;
    }

    std::string modality = tags["Modality"].asString();

    return (modality == "PR");
  }

  Json::Value simplifyInstanceTags(const Json::Value& instanceTags) {
    // keep only the tags we need in the frontend -> otherwise, the full /series route might return 6MB of Json in case of a PET-CT !!!!
    Json::Value toReturn = instanceTags;

    return toReturn;
  }
}


