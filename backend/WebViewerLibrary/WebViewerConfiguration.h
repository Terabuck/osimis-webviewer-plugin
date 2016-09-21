#pragma once

#include <string>
#include <set>
#include <orthanc/OrthancCPlugin.h>

// copiable
class WebViewerConfiguration
{
private:
  OrthancPluginContext* _context;

protected:

public:
  // int decodingThreads;
  bool gdcmEnabled;
  // int cacheSize; // ???
  bool cachedImageStorageEnabled;

  bool restrictTransferSyntaxes;

  std::set<std::string> enabledTransferSyntaxes;

  WebViewerConfiguration(OrthancPluginContext* context) : _context(context) {
    // By default, use half of the available processing cores for the decoding of DICOM images 
    // decodingThreads = (boost::thread::hardware_concurrency()) / 2 || 1;

    // By default, use GDCM
    gdcmEnabled = true;

    // By default, a cache of 100 MB is used 
    // cacheSize = 100; 

    // By default, disable storage attachment cache 
    cachedImageStorageEnabled = false;

    restrictTransferSyntaxes = false;
  }

  // Can be inherited
  virtual ~WebViewerConfiguration() {}

  virtual void parseFile();
};
