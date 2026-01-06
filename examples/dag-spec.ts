import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
  initial: {
    text: "Hello World",
    code: "function analyze() { return 42; }",
    _mock: {
      analyze: { analysis: 'Code analyzed successfully.' },
      summarize: { analysis: 'Text summarized to one sentence.' },
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
      name: 'summarize',
      dependsOn: ['analyze'],
      until: 'analyzeDone',
      maxIter: 3,
      tools: ['mockLLM']
    },
    {
      name: 'score',
      dependsOn: ['summarize'],
      until: 'scoreCheck',
      maxIter: 2,
      tools: ['mockLLM']
    }
  ]
};
