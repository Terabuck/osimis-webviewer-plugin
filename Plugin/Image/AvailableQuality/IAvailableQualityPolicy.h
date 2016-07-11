#pragma once

#include <set>
#include <json/value.h>
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
  virtual std::set<ImageQuality> RetrieveByTags(const Orthanc::DicomMap& headerTags, const Json::Value& otherTags) = 0;
};