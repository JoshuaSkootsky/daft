# DAFT - Declarative Agents, Fast & Type-safe

[![CI](https://github.com/JoshuaSkootsky/daft/actions/workflows/test.yml/badge.svg)](https://github.com/JoshuaSkootsky/daft/actions/workflows/test.yml)
[![API Docs](https://img.shields.io/badge/API-Docs-blue)](https://joshuaskootsky.github.io/daft/)

A declarative framework for describing iterative AI agent workflows in TypeScript.

**📚 [Full API Documentation](https://joshuaskootsky.github.io/daft/)**

## Quick Start

```bash
git clone https://github.com/JoshuaSkootsky/daft.git && cd daft
bun install
echo 'ZEN_API_KEY=your_key_here' > .env
bun run run-local examples/linear-spec.ts
# ✅ Done in 4 iterations
```

**DAFT** lets you describe *what* your data should look like; agents iterate until it does.

## What Is DAFT?

DAFT is a declarative DSL for LLM workflows. You define structure; runtime handles execution.

- **Spec = Declarative DAG** (what to do)
- **Tool = Imperative logic** (how to do it)
- **Predicate = Stop condition** (when to finish)

```typescript
{
  name: 'analyze',
  until: 'hasSummary',
  maxIter: 5,
  tools: ['llm'],
  dependsOn: ['extract']
}
```

**Why DAFT?**

**Narrow surface** → Fast learning curve. Vocabulary: `steps`, `until`, `tools`, `budget`

**Declarative** → Static analysis. Cycle detection, cost estimation, auto-mocking

**Type-safe** → Build-time validation. TypeScript rejects misspelled predicates

**Upgrade path** → Complex logic in tools; DSL stays honest

## DAG Execution

```
    ┌─────────────┐
    │ cheap_summary│
    └──────┬──────┘
           │
       ┌───┴────┬──────────┐
       ▼         ▼          ▼
   ┌───────┐ ┌───────┐  ┌──────┐
   │keywords│ │deep_  │  │ risks │
   └───┬───┘ └────┬──┘  └───┬──┘
       └──────────┴────────┘
                  │
                  ▼
             ┌────────┐
             │ report │
             └────────┘
```

## Stack & Budget

**Built with Bun + Redis:** Fast runtime, native TypeScript, distributed execution

```typescript
budget: { maxTime: 45000, maxTokens: 4000, maxCost: 0.25 }
```

Fail-fast when limits are hit. Zero surprise costs.

## Examples

- **v1-showcase.ts** - Earnings analysis (45s, $0.25)
- **v2-showcase.ts** - Multi-pass code review
- **linear-spec.ts** - Basic workflow
- **dag-spec.ts** - Parallel execution
- **llm-spec.ts** - Budget constraints
- **integration-spec.ts** - Multiple tools

## Core Concepts

### Spec

Declarative workflow definition:
```typescript
import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
  initial: { text: "Hello" },
  steps: [{
    name: 'analyze',
    until: 'analyzeDone',
    maxIter: 5,
    tools: ['llm']
  }]
};
```

### Predicates

Determine when a step should stop iterating: `hasSummary`, `hasKeywords`, `scoreCheck`

### Tools

Tools contain imperative logic. Use built-in (`llm`, `mockLLM`) or create custom:

```typescript
export const myTool = defineTool({
  input: {} as { items: string[] },
  output: {} as { count: number },
  run: async ({ items }) => ({ count: items.length })
});
```

### MockLLM Pattern

Define mock behavior inline for cost-free testing:
```typescript
initial: {
  _mock: {
    summary: { summary: 'Quick overview...' },
    keywords: { keywords: ['AI', 'data'] }
  }
}
```

When `ZEN_API_KEY` is set, steps use real LLM. When unset, mockLLM returns `_mock` data.

## Custom Tools (Escape Hatch)

Keep DSL honest—complex logic lives in tools, not spec. Create, register in `src/tools/index.ts`, and use:

```ts
{ name: 'count', until: 'hasField', tools: ['myTool'] }
```
No `if`, `for`, or expressions in spec—declarative structure + imperative tools.

## Learn More

[Full API Docs](https://joshuaskootsky.github.io/daft/) • [Examples](./examples) • [MIT License](./LICENSE)
