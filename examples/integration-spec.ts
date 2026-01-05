import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
  initial: {
    prompt: "What is 2+2? Answer with just the number."
  },
  budget: {
    maxTime: 60000,
    maxTokens: 5000,
    maxCost: 0.5
  },
  steps: [
    {
      name: 'calculate',
      until: 'hasOutput',
      maxIter: 2,
      tools: ['llm']
    },
    {
      name: 'verify',
      until: 'scoreCheck',
      maxIter: 2,
      tools: ['echo']
    }
  ]
};
