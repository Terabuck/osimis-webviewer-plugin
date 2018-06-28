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
#include "../Instance/InstanceRepository.h"
#include "ViewerToolbox.h"

namespace {
  std::string _getTransferSyntax(const Orthanc::DicomMap& headerTags);
  bool _isDicomSr(const Json::Value &tags);
  bool _isDicomPr(const Json::Value &tags);
  Json::Value simplifyInstanceTags(const Json::Value& instanceTags);
}

SeriesRepository::SeriesRepository(DicomRepository* dicomRepository, InstanceRepository* instanceRepository)
  : _dicomRepository(dicomRepository), _seriesFactory(std::auto_ptr<IAvailableQualityPolicy>(new OnTheFlyDownloadAvailableQualityPolicy)),
    _instanceRepository(instanceRepository)
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
  Json::Value instancesInfos;

  // Retrieve middle instance id
  int instanceCount = slicesShort.size();
  std::string middleInstanceId = slicesShort[instanceCount / 2][0].asString();

  if (getInstanceTags)
  {
    BENCH(RETRIEVE_ALL_INSTANCES_TAGS)
    for(Json::ValueIterator itr = slicesShort.begin(); itr != slicesShort.end(); itr++) {
      std::string instanceId = (*itr)[0].asString();

      instancesInfos[instanceId] = _instanceRepository->GetInstanceInfo(instanceId);
    }
  }
  else
  {// only get the middle instance tags
    instancesInfos[middleInstanceId] = _instanceRepository->GetInstanceInfo(middleInstanceId);
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
  const Json::Value& middleInstanceInfos = instancesInfos[middleInstanceId];

  // Ignore DICOM SR (DICOM report) and PR (DICOM Presentation State, which are
  // `views` referencing other instances) files (they can't be processed by our
  // SeriesFactory) Note this line is only here to provide better error
  // message, also
  // @warning We make the assumption DICOM SR & PR are always a single alone
  //          instance contained within a separate series.
  if (::_isDicomSr(middleInstanceInfos["TagsSubset"]) || ::_isDicomPr(middleInstanceInfos["TagsSubset"])) {
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_IncompatibleImageFormat));
  }

  Json::Value studyInfo;
  if (!OrthancPlugins::GetJsonFromOrthanc(studyInfo, context, "/series/" + seriesId + "/study"))
  {
    throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_InexistentItem));
  }

  // Create a series based on tags and ordered instances
  return std::auto_ptr<Series>(_seriesFactory.CreateSeries(seriesId, slicesShort, tags1, middleInstanceInfos, instancesInfos, studyInfo));
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
    Json::Value toReturn;

    std::vector<std::string> tagsToKeep;
    tagsToKeep.push_back("PatientName");
    tagsToKeep.push_back("PatientID");
    tagsToKeep.push_back("PatientBirthDate");
    tagsToKeep.push_back("PatientIdentityRemoved");
    tagsToKeep.push_back("OsimisNote");
    tagsToKeep.push_back("StudyDescription");
    tagsToKeep.push_back("StudyDate");
    tagsToKeep.push_back("SeriesNumber");
    tagsToKeep.push_back("SeriesDescription");

    // used by the JS code
    tagsToKeep.push_back("PatientOrientation");
    tagsToKeep.push_back("ImageLaterality");
    tagsToKeep.push_back("ViewPosition");
    tagsToKeep.push_back("MIMETypeOfEncapsulatedDocument");
    tagsToKeep.push_back("PhotometricInterpretation");
    tagsToKeep.push_back("PixelSpacing");
    tagsToKeep.push_back("ImagerPixelSpacing");
    tagsToKeep.push_back("SequenceOfUltrasoundRegions");
    tagsToKeep.push_back("PixelRepresentation");
    tagsToKeep.push_back("BitsStored");
    tagsToKeep.push_back("WindowCenter");
    tagsToKeep.push_back("WindowWidth");
    tagsToKeep.push_back("RescaleSlope");
    tagsToKeep.push_back("RescaleIntercept");
    tagsToKeep.push_back("RecommendedDisplayFrameRate");
    tagsToKeep.push_back("ImageOrientationPatient");
    tagsToKeep.push_back("ImagePositionPatient");
    tagsToKeep.push_back("SliceLocation");
    tagsToKeep.push_back("SliceThickness");
    tagsToKeep.push_back("FrameOfReferenceUID");
    tagsToKeep.push_back("HighBit");
    tagsToKeep.push_back("InstanceNumber");

    // used by the C++ code
    tagsToKeep.push_back("Modality");
    tagsToKeep.push_back("Columns");
    tagsToKeep.push_back("Rows");


    for (std::vector<std::string>::const_iterator it = tagsToKeep.begin(); it != tagsToKeep.end(); it++)
    {
      if (!instanceTags[*it].empty())
      {
        toReturn[*it] = OrthancPlugins::SanitizeTag(*it, instanceTags[*it]);
      }
    }

    return toReturn;
  }
}


