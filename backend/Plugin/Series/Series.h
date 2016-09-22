/**
 * Orthanc - A Lightweight, RESTful DICOM Store
 * Copyright (C) 2012-2016 Sebastien Jodogne, Medical Physics
 * Department, University Hospital of Liege, Belgium
 *
 * This program is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 **/


#pragma once

#include <string>
#include <set>
#include <json/value.h>
#include "../../Orthanc/Core/DicomFormat/DicomMap.h"
#include "../AvailableQuality/ImageQuality.h"

class Series : public boost::noncopyable {
friend class SeriesFactory;

public:
  std::string ToJson() const;

private:
  // takes seriesTags memory ownership
  Series(const std::string& seriesId, const Json::Value& seriesTags, const Json::Value& orderedInstances,
      const std::set<ImageQuality>& imageQualities);

  std::string _seriesId;
  Json::Value _seriesTags; // @warning Those are all the tags of the middle instance of the orthanc series!
  Json::Value _orderedInstances;
  std::set<ImageQuality> _imageQualities;
};
