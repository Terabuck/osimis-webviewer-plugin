#include "ResizePolicy.h"

#include <boost/gil/extension/resample.hpp>
#include <boost/gil/extension/sampler.hpp>

#include "../../BenchmarkHelper.h"

ResizePolicy::ResizePolicy(unsigned int maxWidthHeight)
{
  maxWidthHeight_ = maxWidthHeight;
}

IImageContainer* ResizePolicy::Apply(IImageContainer* input, ImageMetaData* metaData)
{
  BENCH(RESIZE_IMAGE)

  RawImageContainer* inRawImage = dynamic_cast<RawImageContainer*>(input);
  if (!inRawImage)
  {
    throw new std::invalid_argument("Input is not raw");
    // @todo Throw exception : input is not a raw image
    return NULL;
  }

  Orthanc::ImageAccessor* accessor = inRawImage->GetOrthancImageAccessor();

  // Keep the same scale
  unsigned int inWidth = accessor->GetWidth();
  unsigned int inHeight = accessor->GetHeight();
  unsigned int outWidth = 0;
  unsigned int outHeight = 0;
  double scale = (double)inHeight / inWidth;

  if (inWidth >= inHeight) {
    outWidth = maxWidthHeight_;
    outHeight = maxWidthHeight_ * scale;
  }
  else {
    outHeight = maxWidthHeight_;
    outWidth = maxWidthHeight_ * (1/scale);
  }
  
  // Create output image buffer
  Orthanc::ImageBuffer* outBuffer = new Orthanc::ImageBuffer;

  // Use the input format for output
  outBuffer->SetFormat(accessor->GetFormat());
  outBuffer->SetWidth(outWidth);
  outBuffer->SetHeight(outHeight);
  Orthanc::ImageAccessor outAccessor = outBuffer->GetAccessor();
  RawImageContainer* outRawImage = new RawImageContainer(outBuffer);

  // Resize the input and put the result in the output
  RawImageContainer::gil_image_view_t inGILView = inRawImage->GetGILImageView();
  RawImageContainer::gil_image_view_t outGILView = outRawImage->GetGILImageView();
//  boost::gil::resize_view(inGILView, outGILView, boost::gil::bilinear_sampler());
  boost::gil::resize_view(inGILView, outGILView, boost::gil::nearest_neighbor_sampler());

  // Update image metadata
  metaData->width = outWidth;
  metaData->height = outHeight;
  metaData->sizeInBytes = outAccessor.GetSize();

  return outRawImage;
}

std::string ResizePolicy::ToString() const 
{ 
  return "resize:" + boost::lexical_cast<std::string>(maxWidthHeight_);
}
