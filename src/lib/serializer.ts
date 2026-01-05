import type { Spec } from './types';

export function serializeSpec(spec: Spec, availablePredicates: Set<string>, availableTools: Set<string>): string {
  for (const step of spec.steps) {
    if (!availablePredicates.has(step.until)) {
      throw new Error(`Unknown predicate: ${step.until}`);
    }
    for (const tool of step.tools) {
      if (!availableTools.has(tool)) {
        throw new Error(`Unknown tool: ${tool}`);
      }
    }
  }

  const serialized = {
    initial: spec.initial,
    steps: spec.steps.map(step => ({
      name: step.name,
      until: step.until,
      maxIter: step.maxIter,
      tools: step.tools,
      dependsOn: step.dependsOn
    })),
    budget: spec.budget
  };

  return JSON.stringify(serialized);
}

export function deserializeSpec(json: string): Spec {
  const data = JSON.parse(json);
  return {
    initial: data.initial,
    steps: data.steps,
    budget: data.budget
  };
}
