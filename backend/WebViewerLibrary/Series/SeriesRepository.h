#pragma once

#include <memory>
#include "../Instance/DicomRepository.h"
#include "Series.h"
#include "SeriesFactory.h"

class InstanceRepository;

/** SeriesRepository [@Repository]
 *
 * Retrieve a Series from an uid.
 *
 * @Responsibility Handle all the I/O operations related to Series
 *
 */
class SeriesRepository : public boost::noncopyable {
public:
  SeriesRepository(DicomRepository* dicomRepository, InstanceRepository* instanceRepository);

  // @throws Orthanc::OrthancException(OrthancPluginErrorCode_InexistentItem)
  std::auto_ptr<Series> GetSeries(const std::string& seriesId, bool getInstanceTags = true);

private:
  DicomRepository* _dicomRepository;
  InstanceRepository* _instanceRepository;
  SeriesFactory _seriesFactory;
};
