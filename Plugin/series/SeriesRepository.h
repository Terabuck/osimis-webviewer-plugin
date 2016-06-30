#pragma once

#include "../instance/DicomRepository.h"
#include "Series.h"

/** SeriesRepository [@Repository]
 *
 * Retrieve a Series from an uid.
 *
 * @Responsibility Handle all the I/O operations related to Series
 *
 */
// @todo boost::noncopyable
class SeriesRepository {
public:
  SeriesRepository(DicomRepository* dicomRepository);

  Series* GetSeries(const std::string& seriesId);

private:
  DicomRepository* _dicomRepository;
};
