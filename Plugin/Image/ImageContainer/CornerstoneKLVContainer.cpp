#include "CornerstoneKLVContainer.h"

#include "../Utilities/KLVWriter.h"

CornerstoneKLVContainer::CornerstoneKLVContainer(IImageContainer* data, const ImageMetaData* metaData)
{
  KLVWriter klvWriter;

  // set metadata
  klvWriter.setValue(Color, metaData->color);
  klvWriter.setValue(Height, metaData->height);
  klvWriter.setValue(Width, metaData->width);
  klvWriter.setValue(SizeInBytes, metaData->sizeInBytes); 

  klvWriter.setValue(ColumnPixelSpacing, metaData->columnPixelSpacing);
  klvWriter.setValue(RowPixelSpacing, metaData->rowPixelSpacing);
  
  klvWriter.setValue(MinPixelValue, metaData->minPixelValue);
  klvWriter.setValue(MaxPixelValue, metaData->maxPixelValue);
  klvWriter.setValue(Slope, metaData->slope);
  klvWriter.setValue(Intercept, metaData->intercept);
  klvWriter.setValue(WindowCenter, metaData->windowCenter);
  klvWriter.setValue(WindowWidth, metaData->windowWidth);

  klvWriter.setValue(IsSigned, metaData->isSigned);
  klvWriter.setValue(Stretched, metaData->stretched);
  klvWriter.setValue(Compression, metaData->compression);

  // set image binary
  klvWriter.setValue(ImageBinary, data->GetBinarySize(), data->GetBinary());

  // write klv binary
  dataAsString_ = klvWriter.write();
  dataAsMemoryBuffer_ = 0;
}

CornerstoneKLVContainer::CornerstoneKLVContainer(OrthancPluginMemoryBuffer* data)
{
  dataAsMemoryBuffer_ = data;
}

CornerstoneKLVContainer::~CornerstoneKLVContainer()
{
  if (dataAsMemoryBuffer_)
  {
    OrthancPluginFreeMemoryBuffer(OrthancContextManager::Get(), dataAsMemoryBuffer_);
    delete dataAsMemoryBuffer_;
  }
}

const char* CornerstoneKLVContainer::GetBinary()
{
  if (dataAsMemoryBuffer_)
  {
    return static_cast<const char*>(dataAsMemoryBuffer_->data);
  }
  else 
  {
    return dataAsString_.c_str();
  }
}
uint32_t CornerstoneKLVContainer::GetBinarySize()
{
  if (dataAsMemoryBuffer_)
  {
    return dataAsMemoryBuffer_->size;
  }
  else
  {
    return dataAsString_.length();
  }
}
