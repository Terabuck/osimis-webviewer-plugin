#pragma once

#include <boost/regex.hpp>
#include <boost/lexical_cast.hpp>
#include "IAvailableQualityPolicy.h"
#include "../../Orthanc/Core/OrthancException.h"
#include "../../Orthanc/Core/Toolbox.h"

/** OnTheFlyDownloadAvailableQualityPolicy
 *
 * Returns avaible image qualities.
 * It is aimed for servers configured with *disabled* image attachment-based cache
 * as they require specific on-the-fly transfer, without being slowed down by the image
 * compressions which would be thrown away after transfer.
 *
 */
class OnTheFlyDownloadAvailableQualityPolicy : public IAvailableQualityPolicy {
public:
  virtual std::set<ImageQuality> RetrieveByTags(const Orthanc::DicomMap& headerTags, const Json::Value& otherTags) {
    using namespace Orthanc;

    std::set<ImageQuality> result;

    // Add low qualities based on image size
    int columns = boost::lexical_cast<int>(otherTags["Columns"].asString());
    int rows = boost::lexical_cast<int>(otherTags["Rows"].asString());
    if (rows > 512 && columns > 512) {
      result.insert(ImageQuality(ImageQuality::LOW)); // 150x150 jpeg80
    }
    if (rows > 1000 && columns > 1000) {
      result.insert(ImageQuality(ImageQuality::MEDIUM)); // 1000x1000 jpeg80
    }

    // Choose either PIXELDATA or LOSSLESS based on transferSyntax

    // Retrieve transfer syntax
    const DicomValue* transfertSyntaxValue = headerTags.TestAndGetValue(0x0002, 0x0010);
    std::string transferSyntax;

    if (transfertSyntaxValue->IsBinary()) {
      throw OrthancException(static_cast<ErrorCode>(OrthancPluginErrorCode_CorruptedFile));
    }
    else if (transfertSyntaxValue == NULL || transfertSyntaxValue->IsNull()) {
      // Set default transfer syntax if not found
      transferSyntax = "1.2.840.10008.1.2";
    }
    else {
      // Stripping spaces should not be required, as this is a UI value
      // representation whose stripping is supported by the Orthanc
      // core, but let's be careful...
      transferSyntax = Toolbox::StripSpaces(transfertSyntaxValue->GetContent());
    }

    // Add either PIXELDATA or LOSSLESS quality based on transfer syntax
    boost::regex regexp("^1\\.2\\.840\\.10008\\.1\\.2\\.4\\.(\\d\\d)$");
    boost::cmatch matches;
    try {
      // Provide direct raw file if the raw is already compressed
      if (boost::regex_match(transferSyntax.c_str(), matches, regexp) && (
          // see http://www.dicomlibrary.com/dicom/transfer-syntax/
          boost::lexical_cast<uint32_t>(matches[1]) == 50 || // Lossy JPEG 8-bit Image Compression
          boost::lexical_cast<uint32_t>(matches[1]) == 51 || // Lossy JPEG 12-bit Image Compression
          boost::lexical_cast<uint32_t>(matches[1]) == 57 || // JPEG Lossless, Nonhierarchical (Processes 14) 
          boost::lexical_cast<uint32_t>(matches[1]) == 70 || // JPEG Lossless, Nonhierarchical, First-Order Prediction (Default Transfer Syntax for Lossless JPEG Image Compression)
          boost::lexical_cast<uint32_t>(matches[1]) == 80 || // JPEG-LS Lossless Image Compression
          boost::lexical_cast<uint32_t>(matches[1]) == 81 || // JPEG-LS Lossy (Near- Lossless) Image Compression
          boost::lexical_cast<uint32_t>(matches[1]) == 90 || // JPEG 2000 Image Compression (Lossless Only)
          boost::lexical_cast<uint32_t>(matches[1]) == 91 || // JPEG 2000 Image Compression
          boost::lexical_cast<uint32_t>(matches[1]) == 92 || // JPEG 2000 Part 2 Multicomponent Image Compression (Lossless Only)
          boost::lexical_cast<uint32_t>(matches[1]) == 93 || // JPEG 2000 Part 2 Multicomponent Image Compression

          boost::lexical_cast<uint32_t>(matches[1]) == 94 || // JPIP Referenced 
          boost::lexical_cast<uint32_t>(matches[1]) == 95 )  // JPIP Referenced Deflate
      ) {
        result.insert(ImageQuality(ImageQuality::PIXELDATA)); // raw file (unknown format)
      }
      // Compress data manually if the raw format is not supported
      else {
        result.insert(ImageQuality(ImageQuality::LOSSLESS)); // lossless png
      }
    }
    catch (const boost::bad_lexical_cast&) {
      assert(false); // should not happen (because of regex)
    }

    return result;
  }
};