import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
  initial: {
    text: "Hello World",
    code: "function foo() { return true; }",
    _mock: {
      analyze: { analysis: 'Code analyzed successfully.' },
      score: { score: 95 }
    }
  },
  steps: [
    {
      name: 'analyze',
      until: 'analyzeDone',
      maxIter: 5,
      tools: ['mockLLM']
    },
    {
      name: 'score',
      until: 'scoreCheck',
      maxIter: 3,
      tools: ['mockLLM']
    }
  ]
};
