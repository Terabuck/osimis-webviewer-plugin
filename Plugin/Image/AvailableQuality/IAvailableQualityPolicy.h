#pragma once

#include <set>
#include "../../Orthanc/Core/DicomFormat/DicomMap.h"
#include "ImageQuality.h"

/** IAvailableQualityPolicy
 *
 * Interface made to suggest which quality Qualitys are available for images
 *   based on instance tags and server configuration
 *
 */
class IAvailableQualityPolicy {
public:
  virtual std::set<ImageQuality> RetrieveByTags(const Orthanc::DicomMap& tags) = 0;
};