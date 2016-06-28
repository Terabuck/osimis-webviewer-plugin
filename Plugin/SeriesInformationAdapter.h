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
#include <orthanc/OrthancCPlugin.h>

namespace OrthancPlugins
{
  class SeriesInformationAdapter
  {
  private:
    OrthancPluginContext* context_;

  public:
    SeriesInformationAdapter(OrthancPluginContext* context) :
      context_(context)
    {
    }

    // WARNING: No mutual exclusion is enforced! Several threads could
    // call this method at the same time.
    bool Create(std::string& content, const std::string& seriesId);  
  };
}
