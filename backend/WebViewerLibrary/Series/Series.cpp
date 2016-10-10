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

#include "Series.h"

#include "ViewerToolbox.h"

#include <Core/OrthancException.h>
#include <boost/regex.hpp>
#include <boost/foreach.hpp>

Series::Series(const std::string& seriesId, const Json::Value& seriesTags, const Json::Value& instancesTags, const Json::Value& orderedInstances,
    const std::set<ImageQuality>& imageQualities)
    : _seriesId(seriesId), _seriesTags(seriesTags), _instancesTags(instancesTags), _orderedInstances(orderedInstances), _imageQualities(imageQualities)
{

}

std::string Series::ToJson() const {
  Json::Value result;
  result["id"] = _seriesId;
  result["tags"] = _seriesTags;
  result["instancesTags"] = _instancesTags;
  result["instances"] = _orderedInstances;
  // result["tags"] = OrthancPlugins::ConvertDicomMapToJson(*_seriesTags.get());

  BOOST_FOREACH(ImageQuality quality, _imageQualities) {
    result["availableQualities"].append(quality.toString());
  }

  return result.toStyledString();
}