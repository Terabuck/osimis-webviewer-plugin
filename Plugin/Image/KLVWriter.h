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

  // @param value never copied, it has to be kept in memory
  void setValue(uint32_t key, size_t length, const char* value);

  std::string write();

private:
  typedef boost::tuple<uint32_t, uint32_t, const uint8_t*> KLVTuple;
  std::vector<KLVTuple> klv_tuples_;
  size_t total_size_;
};

#endif // KLVWRITER_H