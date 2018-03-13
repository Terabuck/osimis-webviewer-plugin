#pragma once

#include <memory>
#include "../Instance/DicomRepository.h"
#include <orthanc/OrthancCPlugin.h>

#include <json/value.h>

class InstanceRepository : public boost::noncopyable {
  OrthancPluginContext* _context;

public:
  InstanceRepository(OrthancPluginContext* context);

  Json::Value StoreInstanceInfoInMetadata(const std::string& instanceId);
  Json::Value GetInstanceInfo(const std::string& instanceId);

protected:
  Json::Value _GetInstanceInfo(const std::string& instanceId);
  static Json::Value SimplifyInstanceTags(const Json::Value& instanceTags);
};
