#ifndef COMPOSITE_POLICY_H
#define COMPOSITE_POLICY_H

#include <vector>
#include "IImageProcessingPolicy.h"

class CompositePolicy : public IImageProcessingPolicy {
public:
  virtual ~CompositePolicy();
  virtual IImageContainer* Apply(IImageContainer* input);

  // takes ownership
  void AddPolicy(IImageProcessingPolicy* policy);
  
private:
  std::vector<IImageProcessingPolicy*> policyChain_;
};

#endif // COMPOSITE_POLICY_H