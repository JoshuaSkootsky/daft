import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
  initial: {
    prompt: "Write a long detailed explanation of quantum mechanics"
  },
  budget: {
    maxTime: 5000,
    maxTokens: 100,
    maxCost: 0.001
  },
  steps: [
    {
      name: 'explain',
      until: 'hasOutput',
      maxIter: 1,
      tools: ['llm']
    }
  ]
};
