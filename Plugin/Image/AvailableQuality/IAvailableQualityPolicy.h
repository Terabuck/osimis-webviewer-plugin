#pragma once

#include <set>
#include <string>
#include <boost/scope_exit.hpp>
#include "../../Orthanc/Core/OrthancException.h" // for throws
#include "../../Instance/DicomRepository.h"
#include "EImageQuality.h"

/** IAvailableQualityPolicy
 *
 * Interface made to suggest which quality Qualitys are available for images
 *   based on image type, instance tags and server configuration
 *
 */
class IAvailableQualityPolicy {
public:
  IAvailableQualityPolicy(DicomRepository* dicomRepository) : _dicomRepository(dicomRepository) {}

  virtual std::set<EImageQuality> RetrieveByImage(const OrthancPluginMemoryBuffer& dicom, unsigned int frameIndex) = 0;

  std::set<EImageQuality> RetrieveByImage(const std::string &instanceId, unsigned int frameIndex) {
    // Load dicom file
    OrthancPluginMemoryBuffer dicom;
    
    if (!_dicomRepository->getDicomFile(instanceId, dicom)) {
      assert(dicom.data == NULL); // Check no memory leak

      throw Orthanc::OrthancException(static_cast<Orthanc::ErrorCode>(OrthancPluginErrorCode_InexistentFile));
    }

    // Clean dicom file memory (at scope end)
    BOOST_SCOPE_EXIT(_dicomRepository, &instanceId) {
      _dicomRepository->decrefDicomFile(instanceId);
    } BOOST_SCOPE_EXIT_END;

    // Return available qualities (using virtual method)
    return this->RetrieveByImage(dicom, frameIndex);
  }

private:
  DicomRepository* _dicomRepository;
};