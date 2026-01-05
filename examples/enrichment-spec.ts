import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
  initial: {
    task: "Provide a 2-word summary of: AI agents"
  },
  budget: {
    maxTime: 60000,
    maxTokens: 5000,
    maxCost: 0.5
  },
  steps: [
    {
      name: 'summarize',
      until: 'hasOutput',
      maxIter: 2,
      tools: ['enrich']
    },
    {
      name: 'extract_keywords',
      dependsOn: ['summarize'],
      until: 'hasOutput',
      maxIter: 2,
      tools: ['enrich']
    },
    {
      name: 'categorize',
      dependsOn: ['extract_keywords'],
      until: 'hasOutput',
      maxIter: 2,
      tools: ['enrich']
    }
  ]
};
