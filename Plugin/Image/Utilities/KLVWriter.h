#ifndef KLVWRITER_H
#define KLVWRITER_H

#include <boost/cstdint.hpp> // for uint32_t
#include <boost/tuple/tuple.hpp>
#include <string>
#include <vector>

// see https://en.wikipedia.org/wiki/KLV
// key & length are written in big endian
class KLVWriter
{
public:
  KLVWriter();

  template<typename T>
  inline void setValue(uint32_t key, const T& value);

  // @param value never copied, it has to be kept in memory
  void setValue(uint32_t key, size_t length, const char* value);

  std::string write();

private:
  typedef boost::tuple<uint32_t, uint32_t, const uint8_t*> KLVTuple;
  std::vector<KLVTuple> klv_tuples_;
  size_t total_size_;
};

template<typename T>
inline void KLVWriter::setValue(uint32_t key, const T& value)
{
  setValue(key, sizeof(value), reinterpret_cast<const char*>(&value));
}

template<>
inline void KLVWriter::setValue<std::string>(uint32_t key, const std::string& value)
{
  setValue(key, value.size(), value.c_str());
}

#endif // KLVWRITER_H