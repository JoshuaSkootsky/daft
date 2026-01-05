import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
  initial: {
    prompt: "Explain what DAFT is in one sentence"
  },
  budget: {
    maxTime: 30000,
    maxTokens: 1000,
    maxCost: 0.1
  },
  steps: [
    {
      name: 'explain',
      until: 'hasOutput',
      maxIter: 3,
      tools: ['llm']
    }
  ]
};
