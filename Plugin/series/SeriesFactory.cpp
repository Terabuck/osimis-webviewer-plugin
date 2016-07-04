#include "SeriesFactory.h"

#include <boost/foreach.hpp>
// #include <json/value.h>
#include <json/json.h>
#include "../../Orthanc/Core/OrthancException.h"
#include "../../Orthanc/Core/Toolbox.h"

using namespace Orthanc;

namespace {
  void _removeInstancesRelatedTags(DicomMap& tags);
  void _setOrderedInstances(Json::Value& orderedInstances, const Json::Value& slicesShort);
  void _setAvailableFormats(const DicomMap& tags);
}

SeriesFactory::SeriesFactory(IAvailableQualityPolicy* availableQualityPolicy)
    : _availableQualityPolicy(availableQualityPolicy)
{

}

Series* SeriesFactory::CreateSeries(const std::string& seriesId, const Json::Value& slicesShort, DicomMap& tags) {
  // Remove instance-related tags
  // @note It may be safer to select the tag to include instead of excluding the wrong one
  _removeInstancesRelatedTags(tags);

  // Set ordered instance list
  // @todo check what to do with this lifecycle
  const Json::Value& orderedInstances = slicesShort;

  // Set available image formats
  _setAvailableFormats(tags);
  
  return new Series(seriesId);
}

namespace {

  void _removeInstancesRelatedTags(DicomMap& tags) {
    DicomTag instanceTags[] = {
      DicomTag(0x0008, 0x0012),   // InstanceCreationDate
      DicomTag(0x0008, 0x0013),   // InstanceCreationTime
      DicomTag(0x0020, 0x0012),   // AcquisitionNumber
      DICOM_TAG_IMAGE_INDEX,
      DICOM_TAG_INSTANCE_NUMBER,
      DICOM_TAG_NUMBER_OF_FRAMES,
      DICOM_TAG_TEMPORAL_POSITION_IDENTIFIER,
      DICOM_TAG_SOP_INSTANCE_UID,
      DICOM_TAG_IMAGE_POSITION_PATIENT,    // New in db v6
      DICOM_TAG_IMAGE_COMMENTS             // New in db v6
    };

    BOOST_FOREACH(const DicomTag& tag, instanceTags) {
      tags.Remove(tag);
    }
  }

  void _setAvailableFormats(const DicomMap& tags) {
    // Retrieve transfer syntax
    const DicomValue* transfertSyntaxValue = tags.TestAndGetValue(0x0002, 0x0010);
    std::string transferSyntax;

    if (transfertSyntaxValue->IsBinary()) {
      throw OrthancException(static_cast<ErrorCode>(OrthancPluginErrorCode_CorruptedFile));
    }
    else if (transfertSyntaxValue == NULL || transfertSyntaxValue->IsNull()) {
      transferSyntax = "1.2.840.10008.1.2"; // Set default transfer syntax if not found
    }
    else {
      // Stripping spaces should not be required, as this is a UI value
      // representation whose stripping is supported by the Orthanc
      // core, but let's be careful...
      transferSyntax = Toolbox::StripSpaces(transfertSyntaxValue->GetContent());
    }

    // Choose available formats based on transferSyntax
    // @todo policy?
  }
}