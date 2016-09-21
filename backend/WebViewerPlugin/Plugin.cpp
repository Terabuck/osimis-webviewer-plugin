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

// static OrthancPluginErrorCode IsStableSeries(OrthancPluginRestOutput* output,
//                                              const char* url,
//                                              const OrthancPluginHttpRequest* request)
// {
//   try
//   {
//     if (request->method != OrthancPluginHttpMethod_Get)
//     {
//       OrthancPluginSendMethodNotAllowed(context_, output, "GET");
//       return OrthancPluginErrorCode_Success;
//     }

//     const std::string id = request->groups[0];
//     Json::Value series;

//     if (OrthancPlugins::GetJsonFromOrthanc(series, context_, "/series/" + id) &&
//         series.type() == Json::objectValue)
//     {
//       bool value = (series["IsStable"].asBool() ||
//                     series["Status"].asString() == "Complete");
//       std::string answer = value ? "true" : "false";
//       OrthancPluginAnswerBuffer(context_, output, answer.c_str(), answer.size(), "application/json");
//     }
//     else
//     {
//       OrthancPluginSendHttpStatusCode(context_, output, 404);
//     }

//     return OrthancPluginErrorCode_Success;
//   }
//   catch (Orthanc::OrthancException& e)
//   {
//     OrthancPluginLogError(context_, e.What());
//     return OrthancPluginErrorCode_Plugin;
//   }
//   catch (std::runtime_error& e)
//   {
//     OrthancPluginLogError(context_, e.what());
//     return OrthancPluginErrorCode_Plugin;
//   }
//   catch (boost::bad_lexical_cast&)
//   {
//     OrthancPluginLogError(context_, "Bad lexical cast");
//     return OrthancPluginErrorCode_Plugin;
//   }
// }

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
    return _webViewer->getName().c_str();
  }


  ORTHANC_PLUGINS_API const char* OrthancPluginGetVersion()
  {
    return _webViewer->getVersion().c_str();
  }
}
