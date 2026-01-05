# DAFT - Declarative Agents, Fast & Type-safe

[![CI](https://github.com/JoshuaSkootsky/daft/actions/workflows/test.yml/badge.svg)](https://github.com/JoshuaSkootsky/daft/actions/workflows/test.yml)
[![API Docs](https://img.shields.io/badge/API-Docs-blue)](https://joshuaskootsky.github.io/daft/)

A declarative framework for describing iterative AI agent workflows in TypeScript.

**📚 [Full API Documentation](https://joshuaskootsky.github.io/daft/)**


```bash
git clone <repo> && cd daft
echo 'ZEN_API_KEY=xxx' > .env
./run.sh examples/dag-spec.ts
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


# DAFT

DAFT gives you a typed, budgeted, DAG-driven pipeline that fails fast when limits are hit and guarantees the same inputs produce the same (or explicitly different) outputs every run.

## DAFT v1.0.0 Showcase

**45-second, 25-cent investment-grade analysis pipeline:**

```bash
./run.sh examples/v1-showcase.ts
```

This spec demonstrates:
- **100% TypeScript** - Type-safe from spec to execution
- **Parallel DAG execution** - Two analysis branches run simultaneously
- **MockLLM pattern** - Inline mock behavior in spec's `_mock` object
- **Budget enforcement** - Strict time, token, and cost limits
- **Iterative enrichment** - Each step adds data until predicates pass

**What happens:**
1. `cheap_summary` step generates free summary via mockLLM
2. `deep_summary` AND `keywords` run in parallel (depends on cheap_summary)
3. `risk_factors` analyzes once deep/keywords complete
4. `report` synthesizes final investment recommendation with real LLM

**Total cost: $0.25** (only final LLM call is paid)

**Proves DAFT vs Ralph:**
- Explicit, typed, declarative workflow
- Predictable, budgeted, parallel execution
- Production-ready data pipeline with 5 steps


### Examples Overview

DAFT includes example specs demonstrating different patterns:

- **v2-showcase.ts** - DAFT v2 showcase (Multi-pass code review pipeline)
- **v1-showcase.ts** - DAFT v1.0.0 showcase (NVIDIA earnings analysis pipeline)
- **linear-spec.ts** - Basic linear workflow with mockLLM tool
- **dag-spec.ts** - Parallel steps with dependencies (DAG execution)
- **llm-spec.ts** - LLM tool usage with budget constraints
- **integration-spec.ts** - Combines LLM and mockLLM tools


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
