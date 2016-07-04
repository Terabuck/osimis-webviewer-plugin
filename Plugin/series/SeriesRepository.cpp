#include "SeriesRepository.h"
#include "../OrthancContextManager.h"

#include "ViewerToolbox.h"

SeriesRepository::SeriesRepository(DicomRepository* dicomRepository)
  : _dicomRepository(dicomRepository)
{
}

Series* SeriesRepository::GetSeries(const std::string& seriesId) {
  OrthancPluginContext* context = OrthancContextManager::Get();

  // @!todo fetch from DICOM instead (so we can gather TransferSyntax)

  Json::Value series, study, patient, ordered;
  if (!OrthancPlugins::GetJsonFromOrthanc(series, context, "/series/" + seriesId) ||
      !OrthancPlugins::GetJsonFromOrthanc(study, context, "/studies/" + series["ID"].asString() + "/module?simplify") ||
      !OrthancPlugins::GetJsonFromOrthanc(patient, context, "/studies/" + series["ID"].asString() + "/module-patient?simplify") ||
      !OrthancPlugins::GetJsonFromOrthanc(ordered, context, "/series/" + series["ID"].asString() + "/ordered-slices") ||
      !series.isMember("Instances") ||
      series["Instances"].type() != Json::arrayValue)
  {
    return 0;
  }
  else {
    return 0;
  }

}