import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
  initial: {
    document: "The quick brown fox jumps over the lazy dog."
  },
  budget: {
    maxTime: 60000,
    maxTokens: 3000,
    maxCost: 0.3
  },
  steps: [
    {
      name: 'summarize',
      until: 'analyzeDone',
      maxIter: 2,
      tools: ['echo']
    },
    {
      name: 'score',
      until: 'scoreCheck',
      maxIter: 2,
      tools: ['echo']
    }
  ]
};
