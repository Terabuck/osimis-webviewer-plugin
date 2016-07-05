#pragma once

#include <json/value.h>
#include "../../Orthanc/Core/DicomFormat/DicomMap.h"

#include "../AvailableQuality/IAvailableQualityPolicy.h"
#include "Series.h"

class SeriesFactory : public boost::noncopyable {
public:
  SeriesFactory(IAvailableQualityPolicy* availableQualityPolicy); // takes ownership

  // @post instance-related tags are removed from tags
  Series* CreateSeries(const std::string& seriesId, const Json::Value& slicesShort, Orthanc::DicomMap& tags);

private:
  std::auto_ptr<IAvailableQualityPolicy> _availableQualityPolicy;
};