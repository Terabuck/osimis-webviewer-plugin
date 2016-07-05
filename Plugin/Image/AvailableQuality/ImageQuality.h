#pragma once

#include <string>

/** ImageQuality
 *
 * @ValueObject (stateless/thread-safe)
 *
 * Describe a generic image quality.
 * Used instead of explicit image format name to avoid adding compression overhead on an already compressed image
 * when an api user ask for an image.
 *
 */
struct ImageQuality {
  enum EImageQuality {
    LOW,
    MEDIUM,
    LOSSLESS
  };

  ImageQuality(EImageQuality quality) : _quality(quality) {}
  ImageQuality(const ImageQuality& o) : _quality(o._quality) {}

  bool operator<(const ImageQuality& o) const { return _quality < o._quality; }
  bool operator<=(const ImageQuality& o) const { return _quality <= o._quality; }
  bool operator==(const ImageQuality& o) const { return _quality == o._quality; }
  bool operator>(const ImageQuality& o) const { return _quality > o._quality; }
  bool operator>=(const ImageQuality& o) const { return _quality >= o._quality; }

  inline EImageQuality toInt() const {
    return _quality;
  }
  inline std::string toString() const {
    switch(_quality) {
    case LOSSLESS:
      return "lossless";
    case MEDIUM:
      return "medium";
    case LOW:
      return "low";
    }
  }

private:
  const EImageQuality _quality;
};