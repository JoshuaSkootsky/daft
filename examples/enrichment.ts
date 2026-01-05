import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
  initial: {
    document: "The quick brown fox jumps over the lazy dog.",
    stepName: 'summarize'
  },
  budget: {
    maxTime: 60000,
    maxTokens: 3000,
    maxCost: 0.3
  },
  steps: [
    {
      name: 'summarize',
      until: 'hasSummary',
      maxIter: 2,
      tools: ['echo']
    },
    {
      name: 'extract_entities',
      dependsOn: ['summarize'],
      until: 'hasEntities',
      maxIter: 2,
      tools: ['echo']
    },
    {
      name: 'categorize',
      dependsOn: ['extract_entities'],
      until: 'hasCategory',
      maxIter: 2,
      tools: ['echo']
    }
  ]
};
