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
class OnTheFlyDownloadAvailableQualityPolicy : public IAvailableQualityPolicy
{
private:
  // Used to choose MQ based on image size
  bool _isLargerThan1000x1000(const Json::Value& otherTags);

  // Used to choose either PIXELDATA or LOSSLESS based on transferSyntax
  bool _isAlreadyCompressedWithinDicom(const Orthanc::DicomMap& headerTags);

public:
  // Returns available qualities depending on the image DICOM tags
  virtual std::set<ImageQuality> RetrieveByTags(const Orthanc::DicomMap& headerTags, const Json::Value& otherTags);
};