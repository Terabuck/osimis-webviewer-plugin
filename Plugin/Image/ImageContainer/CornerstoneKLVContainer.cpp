#include "CornerstoneKLVContainer.h"

#include "../Utilities/KLVWriter.h"
#include "OrthancContextManager.h"

CornerstoneKLVContainer::CornerstoneKLVContainer(IImageContainer* data, const ImageMetaData* metaData) : dataAsMemoryBuffer_(OrthancContextManager::Get())
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

  klvWriter.setValue(OriginalHeight, metaData->originalHeight);
  klvWriter.setValue(OriginalWidth, metaData->originalWidth);

  // set image binary
  klvWriter.setValue(ImageBinary, data->GetBinarySize(), data->GetBinary());

  // write klv binary
  dataAsString_ = klvWriter.write();
}

CornerstoneKLVContainer::CornerstoneKLVContainer(OrthancPluginMemoryBuffer& data) : dataAsMemoryBuffer_(OrthancContextManager::Get(), data)
{
}


const char* CornerstoneKLVContainer::GetBinary() const
{
  if (dataAsMemoryBuffer_.getData() != NULL)
  {
    return static_cast<const char*>(dataAsMemoryBuffer_.getData());
  }
  else 
  {
    return dataAsString_.c_str();
  }
}
uint32_t CornerstoneKLVContainer::GetBinarySize() const
{
  if (dataAsMemoryBuffer_.getData() != NULL)
  {
    return dataAsMemoryBuffer_.getSize();
  }
  else
  {
    return dataAsString_.length();
  }
}
