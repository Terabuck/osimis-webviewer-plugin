#pragma once

#include <string>

#include "../BaseController.h"
#include "SeriesRepository.h"

// .../<series_id>

// @todo boost::noncopyable
class SeriesController : public BaseController, public boost::noncopyable {
public:
  SeriesController(OrthancPluginRestOutput* response, const std::string& url, const OrthancPluginHttpRequest* request);

  template<typename T>
  static void Inject(T* obj);

protected:
  virtual int _ParseURLPostFix(const std::string& urlPostfix);
  virtual int _ProcessRequest();

private:
  static SeriesRepository* seriesRepository_;

  std::string seriesId_;
};
