import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
  initial: {
    prompt: "Write a detailed explanation"
  },
  budget: {
    maxTime: 100000,
    maxTokens: 50,
    maxCost: 0.0001
  },
  steps: [
    {
      name: 'test',
      until: 'hasOutput',
      maxIter: 3,
      tools: ['llm']
    }
  ]
};
