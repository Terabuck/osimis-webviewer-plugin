#ifndef CORNERSTONE_KLV_CONTAINER_H
#define CORNERSTONE_KLV_CONTAINER_H

#include <string>

#include "IImageContainer.h"

class CornerstoneKLVContainer : public IImageContainer {
public:
  CornerstoneKLVContainer();
  virtual ~CornerstoneKLVContainer();

  virtual const char* GetBinary();
  virtual uint32_t GetBinarySize();

private:
  std::string data;
};

#endif // CORNERSTONE_KLV_CONTAINER_H