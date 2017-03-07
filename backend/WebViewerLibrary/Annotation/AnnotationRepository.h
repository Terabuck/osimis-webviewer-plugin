#pragma once

#include <string>
#include <boost/noncopyable.hpp>
#include <json/writer.h> // for Json::Value
#include <orthanc/OrthancCPlugin.h>

/** AnnotationRepository [@Repository]
 *
 * @Responsibility Handle all the I/O operations related to Annotations
 */
class AnnotationRepository : public boost::noncopyable {
public:
  Json::Value getByStudyId(const std::string studyId) const; // throws Orthanc::ErrorCode_UnknownResource & any other orthanc exception
  void setByImageId(const std::string &instanceId, uint32_t frameIndex, const Json::Value& value) const; // throws Orthanc::ErrorCode_UnknownResource & any other orthanc exception
  ~AnnotationRepository();
};
