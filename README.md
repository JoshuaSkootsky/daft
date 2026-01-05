# DAFT - Declarative Agents, Fast & Type-safe

[![CI](https://github.com/JoshuaSkootsky/daft/actions/workflows/test.yml/badge.svg)](https://github.com/JoshuaSkootsky/daft/actions/workflows/test.yml)
[![API Docs](https://img.shields.io/badge/API-Docs-blue)](https://joshuaskootsky.github.io/daft/)

A declarative framework for describing iterative AI agent workflows in TypeScript.

**📚 [Full API Documentation](https://joshuaskootsky.github.io/daft/)**

# DAFT – Declarative Agents, Fast & Type-safe

```bash
git clone <repo> && cd daft
echo 'ZEN_API_KEY=xxx' > .env
./run.sh examples/enrichment.json
# ✅ Done in 4 iterations – { summary: "...", entities: [...] }
```

**DAFT** lets you describe *what* your data should look like; agents iterate until it does.


## 30-second start

```bash
./run.sh examples/linear-spec.ts examples/data.json
```

DAFT is Declarative Agent Framework Tooling

Control flow is data.

The “plan” is a Typescript object, a DAG or even a single declarative object that the runtime interprets.


## Stack & scope

Built with **Bun** and **Redis**; automate any iterative workflow—data enrichment, LLM pipelines, scraping, testing, or your own custom tools.

## Learn more

[Full API Docs](https://joshuaskootsky.github.io/daft/) • [Examples](./examples) • [License: MIT](./LICENSE)


# Concepts

1. Iterative enrichment – each step adds fields until a predicate passes.

2. DAG parallelism – steps run as soon as their dependencies are satisfied.

3. Built-in budgets – time, tokens, dollars; fail-fast when exceeded.




### Examples Overview

DAFT includes several example specs demonstrating different patterns:

- **linear-spec.ts** - Basic linear workflow with echo tool
- **dag-spec.ts** - Parallel steps with dependencies
- **llm-spec.ts** - LLM tool usage with hasOutput predicate
- **integration-spec.ts** - Combines LLM and echo tools
- **enrichment-example.ts** - Demonstrates iterative data enrichment pattern
- **budget-spec.ts** - Budget enforcement (time/token limits)


# Detailed Description

### Specs

A **spec** declares WHAT should happen, not HOW:

```typescript
import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
  initial: { text: "Hello" },  // Starting data
  steps: [                      // Declarative workflow
    {
      name: 'analyze',
      until: 'analyzeDone',     // Predicate name (when to stop)
      maxIter: 5,              // Max iterations
      tools: ['llm']            // Tools to run
    }
  ]
};
```
