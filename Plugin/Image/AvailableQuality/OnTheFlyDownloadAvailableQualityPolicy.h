#pragma once

#include "IAvailableQualityPolicy.h"

/** OnTheFlyDownloadAvailableQualityPolicy
 *
 * Returns avaible image qualities.
 * It is aimed for servers configured with *disabled* image attachment-based cache
 * as they require specific on-the-fly transfer, without being slowed down by the image
 * compressions which would be thrown away after transfer.
 *
 */
class OnTheFlyDownloadAvailableQualityPolicy : public IAvailableQualityPolicy {
public:
  virtual std::set<ImageQuality> RetrieveByTags(const Orthanc::DicomMap& tags) {
  //   // Retrieve transfer syntax
  //   const DicomValue* transfertSyntaxValue = tags.TestAndGetValue(0x0002, 0x0010);
  //   std::string transferSyntax;

  //   if (transfertSyntaxValue->IsBinary()) {
  //     throw OrthancException(static_cast<ErrorCode>(OrthancPluginErrorCode_CorruptedFile));
  //   }
  //   else if (transfertSyntaxValue == NULL || transfertSyntaxValue->IsNull()) {
  //     transferSyntax = "1.2.840.10008.1.2"; // Set default transfer syntax if not found
  //   }
  //   else {
  //     // Stripping spaces should not be required, as this is a UI value
  //     // representation whose stripping is supported by the Orthanc
  //     // core, but let's be careful...
  //     transferSyntax = Toolbox::StripSpaces(transfertSyntaxValue->GetContent());
  //   }

  //   // Choose available formats based on transferSyntax
  //   // @todo policy?
    std::set<ImageQuality> result;

    result.insert(ImageQuality(ImageQuality::LOW));
    // result.insert(ImageQuality(ImageQuality::MEDIUM));
    result.insert(ImageQuality(ImageQuality::LOSSLESS));

    return result;
  }
};