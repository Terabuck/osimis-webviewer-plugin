#pragma once

#include <boost/thread.hpp>
#include <boost/lexical_cast.hpp>
#include "../Orthanc/Core/IDynamicObject.h"
#include "../Orthanc/Core/SystemToolbox.h"
#include "../Orthanc/Core/FileStorage/FilesystemStorage.h"
#include "../Orthanc/Core/SQLite/Connection.h"
#include "../Orthanc/Plugins/Samples/GdcmDecoder/GdcmDecoderCache.h"
#include "CacheManager.h"
#include "CacheScheduler.h"
#include "jsoncpp/json/json.h"
#include "ViewerToolbox.h"

enum CacheBundle
{
  CacheBundle_DecodedImage = 1,
//  CacheBundle_InstanceInformation = 2,
  CacheBundle_SeriesInformation = 3
};


class CacheContext
{
private:
  class DynamicString : public Orthanc::IDynamicObject
  {
  private:
    std::string  value_;

  public:
    DynamicString(const char* value) : value_(value)
    {
    }

    const std::string& GetValue() const
    {
      return value_;
    }
  };

  OrthancPluginContext* pluginContext_;
  Orthanc::FilesystemStorage  storage_;
  Orthanc::SQLite::Connection  db_;

  std::auto_ptr<OrthancPlugins::CacheManager>  cache_;
  std::auto_ptr<OrthancPlugins::CacheScheduler>  scheduler_;

  Orthanc::SharedMessageQueue  newInstances_;
  bool stop_;
  boost::thread newInstancesThread_;
  OrthancPlugins::GdcmDecoderCache  decoder_;


  static void NewInstancesThread(CacheContext* cache)
  {
    while (!cache->stop_)
    {
      std::auto_ptr<Orthanc::IDynamicObject> obj(cache->newInstances_.Dequeue(100));
      if (obj.get() != NULL)
      {
        const std::string& instanceId = dynamic_cast<DynamicString&>(*obj).GetValue();

        // On the reception of a new instance, indalidate the parent series of the instance
        std::string uri = "/instances/" + std::string(instanceId);
        Json::Value instance;
        if (OrthancPlugins::GetJsonFromOrthanc(instance, cache->pluginContext_, uri))
        {
          std::string seriesId = instance["ParentSeries"].asString();
          cache->GetScheduler().Invalidate(OrthancPlugins::CacheBundle_SeriesInformation, seriesId);
        }
      }
    }
  }


public:

  CacheContext(const std::string& path, OrthancPluginContext* pluginContext) : storage_(path), stop_(false), pluginContext_(pluginContext)
  {
    boost::filesystem::path p(path);
    db_.Open((p / "cache.db").string());

    cache_.reset(new OrthancPlugins::CacheManager(pluginContext_, db_, storage_));
    //cache_->SetSanityCheckEnabled(true);  // For debug

    scheduler_.reset(new OrthancPlugins::CacheScheduler(*cache_, 100));  // TODO: get 100 from configuration file

    newInstancesThread_ = boost::thread(NewInstancesThread, this);
  }

  ~CacheContext()
  {
    stop_ = true;
    if (newInstancesThread_.joinable())
    {
      newInstancesThread_.join();
    }

    scheduler_.reset(NULL);
    cache_.reset(NULL);
  }

  OrthancPlugins::CacheScheduler& GetScheduler()
  {
    return *scheduler_;
  }

  void SignalNewInstance(const char* instanceId)
  {
    newInstances_.Enqueue(new DynamicString(instanceId));
  }

  OrthancPlugins::GdcmDecoderCache&  GetDecoder()
  {
    return decoder_;
  }
};

