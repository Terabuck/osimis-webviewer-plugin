#include "RawImageContainer.h"

#include "../../ViewerToolbox.h" // for Convert

RawImageContainer::RawImageContainer(OrthancPluginImage* data)
{
  dataAsImageBuffer_ = 0;
  dataAsImageWrapper_ = new OrthancPlugins::OrthancImageWrapper(OrthancContextManager::Get(), data);

  accessor_.AssignReadOnly(OrthancPlugins::Convert(dataAsImageWrapper_->GetFormat()), dataAsImageWrapper_->GetWidth(),
                            dataAsImageWrapper_->GetHeight(), dataAsImageWrapper_->GetPitch(), dataAsImageWrapper_->GetBuffer());
}

RawImageContainer::RawImageContainer(Orthanc::ImageBuffer* data) : accessor_(data->GetAccessor())
{
  dataAsImageBuffer_ = data;
  dataAsImageWrapper_ = 0;
}

RawImageContainer::~RawImageContainer() 
{
  if (dataAsImageWrapper_)
  {
    // @todo check if content is freed at destruction ?
    delete dataAsImageWrapper_;
  }

  if (dataAsImageBuffer_)
  {
    // @todo check if content is freed at destruction ?
    delete dataAsImageBuffer_;
  }
}

const char* RawImageContainer::GetBinary()
{
  return reinterpret_cast<const char *>(accessor_.GetConstBuffer());
}
uint32_t RawImageContainer::GetBinarySize()
{
  return accessor_.GetSize(); // height * pitch
}

Orthanc::ImageAccessor* RawImageContainer::GetOrthancImageAccessor()
{
  return &accessor_;
}
