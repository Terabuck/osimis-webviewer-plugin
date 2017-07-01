#include "CacheContext.h"
#include "Series/SeriesRepository.h"
#include <boost/foreach.hpp>

CacheContext::CacheContext(const std::string& path,
                           OrthancPluginContext* pluginContext,
                           bool debugLogsEnabled,
                           bool prefetchOnInstanceStored,
                           SeriesRepository* seriesRepository)
  : storage_(path),
    stop_(false),
    pluginContext_(pluginContext),
    prefetchOnInstanceStored_(prefetchOnInstanceStored),
    seriesRepository_(seriesRepository)
{
  boost::filesystem::path p(path);
  db_.Open((p / "cache.db").string());

  logger_.reset(new CacheLogger(pluginContext_, debugLogsEnabled));
  cacheManager_.reset(new OrthancPlugins::CacheManager(pluginContext_, db_, storage_));
  //cache_->SetSanityCheckEnabled(true);  // For debug

  scheduler_.reset(new OrthancPlugins::CacheScheduler(*cacheManager_, logger_.get(), 1000));

  newInstancesThread_ = boost::thread(NewInstancesThread, this);
}

CacheContext::~CacheContext()
{
  stop_ = true;
  if (newInstancesThread_.joinable())
  {
    newInstancesThread_.join();
  }

  scheduler_.reset(NULL);
  cacheManager_.reset(NULL);
}


void CacheContext::NewInstancesThread(CacheContext* that)
{
  while (!that->stop_)
  {
    std::auto_ptr<Orthanc::IDynamicObject> obj(that->newInstances_.Dequeue(100));
    if (obj.get() != NULL)
    {
      const std::string& instanceId = dynamic_cast<DynamicString&>(*obj).GetValue();

      // On the reception of a new instance, indalidate the parent series of the instance
      std::string uri = "/instances/" + std::string(instanceId);
      Json::Value instance;
      if (OrthancPlugins::GetJsonFromOrthanc(instance, that->pluginContext_, uri))
      {
        std::string seriesId = instance["ParentSeries"].asString();
        that->GetScheduler().Invalidate(OrthancPlugins::CacheBundle_SeriesInformation, seriesId);

        // also start pre-computing the images for the instance
        if (that->prefetchOnInstanceStored_)
        {
          std::auto_ptr<Series> series = that->seriesRepository_->GetSeries(seriesId);

          std::vector<ImageQuality> qualitiesToPrefetch = series->GetOrderedImageQualities();
          BOOST_FOREACH(ImageQuality quality, qualitiesToPrefetch) {
            that->GetScheduler().Prefetch(OrthancPlugins::CacheBundle_DecodedImage, instanceId + "/0/" + quality.toProcessingPolicytString()); // TODO: for multi-frame images, we should prefetch all frames and not onlyt the first one !
          }
        }

      }

    }
  }
}

void CacheLogger::LogCacheDebugInfo(const std::string& message)
{
  if (debugLogsEnabled_)
  {
    OrthancPluginLogInfo(pluginContext_, (std::string("SHORT_TERM_CACHE: ") + message).c_str());
  }

}

