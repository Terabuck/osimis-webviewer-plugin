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

#include <orthanc/OrthancCPlugin.h>
#include <WebViewer.h>

WebViewer* _webViewer;

extern "C"
{
  ORTHANC_PLUGINS_API int32_t OrthancPluginInitialize(OrthancPluginContext* context)
  {
    _webViewer = new WebViewer(context);

    _webViewer->start();

    return 0;
  }


  ORTHANC_PLUGINS_API void OrthancPluginFinalize()
  {
    delete _webViewer;
  }


  ORTHANC_PLUGINS_API const char* OrthancPluginGetName()
  {
    // Call static methods to retrieve version since _webViewer is not initialized yet
    return WebViewer::getName().c_str();
  }


  ORTHANC_PLUGINS_API const char* OrthancPluginGetVersion()
  {
    // Call static methods to retrieve version since _webViewer is not initialized yet
    return WebViewer::getVersion().c_str();
  }
}
