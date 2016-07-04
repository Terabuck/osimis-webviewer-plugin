#pragma once

#include "IAvailableQualityPolicy.h"

/** OnTheFlyDownloadAvailableQualityPolicy
 *
 * Returns avaible image qualities.
 * It is aimed for servers configured with *disabled* image attachment-based cache
 * as they require specific on-the-fly transfer, without being slowed down by the image
 * compressions which would be thrown away after transfer.
 *
 */
class OnTheFlyDownloadAvailableQualityPolicy : public IAvailableQualityPolicy {
public:
  OnTheFlyDownloadAvailableQualityPolicy(DicomRepository* dicomRepository)
      : IAvailableQualityPolicy(dicomRepository) {}
      
  virtual std::set<EImageQuality> RetrieveByImage(const OrthancPluginMemoryBuffer& dicom, unsigned int frameIndex) {

  }
};