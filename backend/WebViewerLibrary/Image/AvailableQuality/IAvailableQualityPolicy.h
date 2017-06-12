#pragma once

#include <set>
#include <json/value.h>
#include "ImageQuality.h"

/** IAvailableQualityPolicy
 *
 * Interface made to suggest which qualities are available for images
 *   based on instance tags and server configuration
 *
 */
class IAvailableQualityPolicy {
public:
  virtual std::set<ImageQuality> retrieveByTags(const Json::Value& headerTags, const Json::Value& otherTags) = 0;
};