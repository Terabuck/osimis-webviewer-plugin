#pragma once

#include <memory>
#include <json/value.h>
#include "../../Orthanc/Core/DicomFormat/DicomMap.h"
#include "../AvailableQuality/IAvailableQualityPolicy.h"
#include "Series.h"

class SeriesFactory : public boost::noncopyable {
public:
  SeriesFactory(std::auto_ptr<IAvailableQualityPolicy> availableQualityPolicy); // takes ownership

  std::auto_ptr<Series> CreateSeries(const std::string& seriesId, const Json::Value& slicesShort,
      const Orthanc::DicomMap& metaInfoTags, const Json::Value& otherTags, const Json::Value& instancesTags);

private:
  const std::auto_ptr<IAvailableQualityPolicy> _availableQualityPolicy;
};