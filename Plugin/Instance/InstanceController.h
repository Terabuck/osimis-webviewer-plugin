#pragma once

#include <string>

#include "../BaseController.h"
#include "DicomRepository.h"

// .../<instance_id>/

// @todo boost::noncopyable
class InstanceController : public BaseController {
public:
  InstanceController(OrthancPluginRestOutput* response, const std::string& url, const OrthancPluginHttpRequest* request);

  template<typename T>
  static void Inject(T* obj);

protected:
  virtual OrthancPluginErrorCode _ParseURLPostFix(const std::string& urlPostfix);
  virtual OrthancPluginErrorCode _ProcessRequest();

private:
  static DicomRepository* dicomRepository_;

  std::string instanceId_;
};
