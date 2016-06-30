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

#include "../Orthanc/Core/OrthancException.h"
#include <boost/regex.hpp>

Series::Series(const std::string& seriesId) : _seriesId(seriesId)
{
}

std::string Series::ToJson() const {
  std::string content;

  Json::Value result;
//   result["ID"] = seriesId;
//   result["SeriesDescription"] = series["MainDicomTags"]["SeriesDescription"].asString();
//   result["StudyDescription"] = study["StudyDescription"].asString();
//   result["PatientID"] = patient["PatientID"].asString();
//   result["PatientName"] = patient["PatientName"].asString();
//   result["Type"] = ordered["Type"];
//   result["Slices"] = ordered["Slices"];

//   boost::regex pattern("^/instances/([a-f0-9-]+)/frames/([0-9]+)$");

//   for (Json::Value::ArrayIndex i = 0; i < result["Slices"].size(); i++)
//   {
//     boost::cmatch what;
//     if (regex_match(result["Slices"][i].asCString(), what, pattern))
//     {
//       result["Slices"][i] = std::string(what[1]) + "_" + std::string(what[2]);
//     }
//     else
//     {
//       // @todo throw exception
//     }
//   }

//   // @todo do somthing with it.
  return result.toStyledString();
}