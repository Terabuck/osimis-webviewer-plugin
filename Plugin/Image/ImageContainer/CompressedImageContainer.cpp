#include "CompressedImageContainer.h"

#include "../../OrthancContextManager.h"

CompressedImageContainer::CompressedImageContainer(OrthancPluginMemoryBuffer* buffer): data_(buffer) {

}
CompressedImageContainer::~CompressedImageContainer() {
  OrthancPluginFreeMemoryBuffer(OrthancContextManager::Get(), data_);
  delete data_;
}

const char* CompressedImageContainer::GetBinary() {
  return reinterpret_cast<const char*>(data_->data);
}
uint32_t CompressedImageContainer::GetBinarySize() {
  return data_->size;
}
