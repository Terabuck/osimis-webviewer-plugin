#include "KLVEmbeddingPolicy.h"

#include "../../BenchmarkHelper.h"
#include "../ImageContainer/CornerstoneKLVContainer.h"

IImageContainer* KLVEmbeddingPolicy::Apply(IImageContainer* data, ImageMetaData* metaData)
{
  BENCH(EMBED_IN_KLV)
  CornerstoneKLVContainer* klvContainer = new CornerstoneKLVContainer(data, metaData);
  return klvContainer;
}