import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
  initial: {
    text: "Hello World",
    code: "function analyze() { return 42; }"
  },
  steps: [
    {
      name: 'analyze',
      until: 'analyzeDone',
      maxIter: 5,
      tools: ['echo']
    },
    {
      name: 'summarize',
      dependsOn: ['analyze'],
      until: 'analyzeDone',
      maxIter: 3,
      tools: ['echo']
    },
    {
      name: 'score',
      dependsOn: ['summarize'],
      until: 'scoreCheck',
      maxIter: 2,
      tools: ['echo']
    }
  ]
};
