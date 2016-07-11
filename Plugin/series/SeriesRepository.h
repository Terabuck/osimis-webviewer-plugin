#pragma once

#include <memory>
#include "../Instance/DicomRepository.h"
#include "Series.h"
#include "SeriesFactory.h"

/** SeriesRepository [@Repository]
 *
 * Retrieve a Series from an uid.
 *
 * @Responsibility Handle all the I/O operations related to Series
 *
 */
// @todo boost::noncopyable
class SeriesRepository : public boost::noncopyable {
public:
  SeriesRepository(DicomRepository* dicomRepository);

  // @throws Orthanc::OrthancException(OrthancPluginErrorCode_InexistentItem)
  std::auto_ptr<Series> GetSeries(const std::string& seriesId);

private:
  DicomRepository* _dicomRepository;
  SeriesFactory _seriesFactory;
};
