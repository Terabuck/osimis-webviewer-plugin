#include "CompositePolicy.h"

#include <boost/foreach.hpp>

CompositePolicy::~CompositePolicy()
{
  BOOST_FOREACH(IImageProcessingPolicy* policy, policyChain_)
  {
    delete policy;
  }
}

IImageContainer* CompositePolicy::Apply(IImageContainer* input)
{
  IImageContainer* output = input;
  
  BOOST_FOREACH(IImageProcessingPolicy* policy, policyChain_)
  {
    output = policy->Apply(output);
  }

  return output;
}

void CompositePolicy::AddPolicy(IImageProcessingPolicy* policy)
{
  policyChain_.push_back(policy);
}