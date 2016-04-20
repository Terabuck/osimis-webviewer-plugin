#include "JpegImageContainer.h"

#include "../../OrthancContextManager.h"

JpegImageContainer::JpegImageContainer(OrthancPluginMemoryBuffer* buffer): data_(buffer) {

}
JpegImageContainer::~JpegImageContainer() {
  OrthancPluginFreeMemoryBuffer(OrthancContextManager::Get(), data_);
  delete data_;
}

const char* JpegImageContainer::GetBinary() {
  return 0;
}
uint32_t JpegImageContainer::GetBinarySize() {
  return 0;
}
