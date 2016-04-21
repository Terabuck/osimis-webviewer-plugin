#include "KLVWriter.h"
#include <boost/asio.hpp> // for cross platform htonl include
#include <boost/foreach.hpp>

KLVWriter::KLVWriter()
{
  total_size_ = 0;
}

void KLVWriter::setValue(uint32_t key, size_t length, const char* value)
{
  // @todo catch  bad_numeric_cast, (negative_overflow) and positive_overflow std::bad_cast 

  KLVTuple klvTuple(key, boost::numeric_cast<uint32_t>(length), reinterpret_cast<const uint8_t *>(value), false);
  klv_tuples_.push_back(klvTuple);

  total_size_ += 4 + 4 + length; // key byte + length byte + value length
}

std::string KLVWriter::write() {
  // @todo catch BadAlloc (string)
  std::string result;
  result.reserve(total_size_);

  BOOST_FOREACH(const KLVTuple& klvTuple, klv_tuples_)
  {
    uint32_t key = klvTuple.get<0>();
    uint32_t length = klvTuple.get<1>();
    const uint8_t* value = klvTuple.get<2>();
    bool convertValueEndianness = klvTuple.get<3>();

    // append key & length
    if (Orthanc::Toolbox::DetectEndianness() == Orthanc::Endianness_Little) {
      // convert key & length to big_endian
      // std::string#operator+= requires single char

      char* keyByte = (char*) &key;
      result += keyByte[3];
      result += keyByte[2];
      result += keyByte[1];
      result += keyByte[0];

      char* lengthByte = (char*) &length;
      result += lengthByte[3];
      result += lengthByte[2];
      result += lengthByte[1];
      result += lengthByte[0];
    }
    else {
      char* keyByte = (char*) &key;
      result += keyByte[0];
      result += keyByte[1];
      result += keyByte[2];
      result += keyByte[3];

      char* lengthByte = (char*) &length;
      result += lengthByte[0];
      result += lengthByte[1];
      result += lengthByte[2];
      result += lengthByte[3];
    }

    // @note make sure length still has the host endianness

    // append value
    if (Orthanc::Toolbox::DetectEndianness() == Orthanc::Endianness_Little && convertValueEndianness)
    {
      // revert endianness
      char valueBigEndian[4] = {0, 0, 0, 0};
      for (int i=0; i<length; ++i)
      {
        // use reinterpet_cast on ptr because standard cast change value content (unsigned to signed)
        valueBigEndian[i] += *reinterpret_cast<const char*>(&value[length-1-i]);
      }

      result.append(valueBigEndian, length);
    }
    else
    {
      result.append(reinterpret_cast<const char *>(value), length);
    }

  }

  return result;
}
