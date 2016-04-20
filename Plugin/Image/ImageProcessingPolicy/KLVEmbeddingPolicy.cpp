#include "KLVEmbeddingPolicy.h"

#include "../ImageContainer/CornerstoneKLVContainer.h"

IImageContainer* KLVEmbeddingPolicy::Apply(IImageContainer* data, ImageMetaData* metaData)
{
  CornerstoneKLVContainer* klvContainer = new CornerstoneKLVContainer(data, metaData);
  return klvContainer;
}