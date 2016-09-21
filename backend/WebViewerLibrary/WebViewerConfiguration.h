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
  bool cachedImageStorageEnabled;

  bool gdcmEnabled;
  bool restrictTransferSyntaxes;
  std::set<std::string> enabledTransferSyntaxes;

  WebViewerConfiguration(OrthancPluginContext* context) : _context(context) {
    // By default, disable storage attachment cache 
    cachedImageStorageEnabled = false;

    // By default, use GDCM
    gdcmEnabled = true;
    // By default, use GDCM for everything
    restrictTransferSyntaxes = false;
  }

  // Can be inherited
  virtual ~WebViewerConfiguration() {}

  virtual void parseFile();
};
