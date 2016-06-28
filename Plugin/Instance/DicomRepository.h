#pragma once

#include <boost/thread/mutex.hpp>
#include <deque>
#include <string>
#include <orthanc/OrthancCPlugin.h>

/** DicomRepository [@Repository]
 *
 * Retrieve a Dicom file from an instance uid.
 *
 * @Responsibility Handle all the I/O operations related to Dicom Files
 *
 * @Responsibility Manage cache
 *   Note the cache is stateful and thus is not compatible with the Osimis cloud load-balancer
 *   stateless requirements !
 *
 */
class DicomRepository {

  struct DicomFile
  {
    std::string                     instanceId;
    OrthancPluginMemoryBuffer       dicomFileBuffer;
    int                             refCount;
  };

public:
  bool getDicomFile(const std::string instanceId, OrthancPluginMemoryBuffer& buffer) const;
//  void increfDicomFile(const std::string instanceId);
  void decrefDicomFile(const std::string instanceId) const;
//  void addDicomFile(const std::string instanceId, OrthancPluginMemoryBuffer& buffer);

private:
  mutable std::deque<DicomFile> _dicomFiles; //keep a few of the last dicomFile in memory to avoid reloading them many times when requesting different frames or different image quality
  mutable boost::mutex          _dicomFilesMutex; //to prevent multiple threads modifying the _dicomFiles
};
