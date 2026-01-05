import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
  initial: {
    text: "Hello World",
    code: "function foo() { return true; }"
  },
  steps: [
    {
      name: 'analyze',
      until: 'analyzeDone',
      maxIter: 5,
      tools: ['echo']
    },
    {
      name: 'score',
      until: 'scoreCheck',
      maxIter: 3,
      tools: ['echo']
    }
  ]
};
