# DAFT - Declarative Agents, Fast & Type-safe

[![CI](https://github.com/skootsky/daft/actions/workflows/test.yml/badge.svg)](https://github.com/skootsky/daft/actions/workflows/test.yml)

A declarative framework for describing iterative AI agent workflows in TypeScript.

> **💡 Quick Tip:** Running `bun run cleanup` before starting new workers prevents stale process issues during development.

## Quick Start

**⚠️ Worker Cleanup:** If you're running workers and they become stale, run `bun run cleanup` before starting new ones.

### Installation

```bash
# Clone and install
git clone <repo>
cd daft
bun install
```

### Configuration

Set your OpenCode Zen API key:

```bash
export ZEN_API_KEY=your_api_key_here
```

### Run Your First Spec

```bash
# Test with example data
./run.sh examples/linear-spec.ts examples/data.json
```

**Output**:
```
Type-checking examples/linear-spec.ts...
✓ Type-check passed

Executing spec locally...
  [analyze] Iteration 1: No analysis found
  [analyze] Iteration 2: Complete
  [score] Iteration 1: Score 75 < 80
  [score] Iteration 2: Score 82 >= 80 ✓

✅ Done in 4 iterations
Result: {"text":"Example input data","code":"function example() { return 42; }","score":82,"analysis":"complete"}

Usage:
  Tokens: 0
  Cost: $0.0000
  Duration: 0.0s
```

## Concepts

### Iterative Data Enrichment

DAFT excels at iteratively enriching data through multiple steps, where each step adds new information to the data object. The result is progressively richer data that accumulates insights.

**Example** (`examples/enrichment.ts`):

```typescript
export default {
  initial: {
    document: "The quick brown fox jumps over the lazy dog."
  },
  steps: [
    {
      name: 'summarize',
      until: 'analyzeDone',     // Step 1: Adds summary field
      maxIter: 2,
      tools: ['llm']
    },
    {
      name: 'extract_entities',   // Step 2: Depends on summarize, adds entities
      dependsOn: ['summarize'],
      until: 'truthy',
      maxIter: 2,
      tools: ['llm']
    },
    {
      name: 'categorize',           // Step 3: Depends on entities, adds category
      dependsOn: ['extract_entities'],
      until: 'truthy',
      maxIter: 2,
      tools: ['llm']
    }
  ]
};
```

**After execution**:
```javascript
{
  document: "The quick brown fox jumps over the lazy dog.",
  summary: "Brief summary of the document...",
  entities: ["fox", "dog", "jumping"],
  category: "Animals"
}
```

Each step:
1. **Accumulates context** from previous steps via `dependsOn`
2. **Adds new fields** through tool execution
3. **Continues until predicate satisfied** (e.g., field exists, condition met)

This pattern enables complex data pipelines: extract → transform → enrich → validate.

### Examples Overview

DAFT includes several example specs demonstrating different patterns:

- **linear-spec.ts** - Basic linear workflow with echo tool
- **dag-spec.ts** - Parallel steps with dependencies
- **llm-spec.ts** - LLM tool usage with hasOutput predicate
- **integration-spec.ts** - Combines LLM and echo tools
- **enrichment-example.ts** - Demonstrates iterative data enrichment pattern
- **budget-spec.ts** - Budget enforcement (time/token limits)

**All examples have been tested and verified working.**

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

### Predicates

**Predicates** determine when a step is complete:

```typescript
// Built-in predicate
until: 'analyzeDone'

// Custom predicate
export const predicates = {
  myCustom: (data) => {
    return {
      ok: data.myField === 'complete',
      msg: 'My field not complete'
    };
  }
};
```

### Tools

**Tools** are the actions that transform data:

```typescript
import { defineTool } from '../src/tools';

tools.myTool = defineTool({
  name: 'myTool',
  input: {} as { query: string },
  output: {} as { result: string },
  description: 'My custom tool',
  run: async (input) => {
    return { output: `Result: ${input.query}` };
  }
});
```

### DAG Execution

Steps with `dependsOn` run in parallel (when deps are satisfied):

```typescript
steps: [
  {
    name: 'analyze',
    until: 'analyzeDone',
    maxIter: 5,
    tools: ['llm']
  },
  {
    name: 'summarize',
    dependsOn: ['analyze'],  // Waits for analyze
    until: 'analyzeDone',
    maxIter: 3,
    tools: ['llm']
  },
  {
    name: 'translate',
    dependsOn: ['summarize'],  // Waits for summarize
    until: 'truthy',
    maxIter: 2,
    tools: ['llm']
  }
]
```

`analyze` → `summarize` (parallel with nothing, waits for analyze) → `translate`

## Built-in Predicates

- `alwaysTrue` - Always succeeds
- `analyzeDone` - Checks if `analysis` field exists
- `scoreCheck` - Checks if `score >= 80`
- `truthy` - Checks if value is truthy

## Built-in Tools

- `llm` - Calls OpenCode Zen LLM (requires `ZEN_API_KEY`)
- `echo` - Adds analysis field and increments score (for testing)

## CLI Commands

### Quick Test

```bash
# With data file
./run.sh examples/linear-spec.ts examples/data.json

# Without data (uses spec's initial)
./run.sh examples/dag-spec.ts
```

### Submit to Redis (distributed)

```bash
# Terminal 1: Start worker
bun run worker

# Terminal 2: Submit job
bun run submit examples/linear-spec.ts

# Terminal 3: View logs
bun run logs

# Clean up stale workers (if needed)
bun run cleanup
```

**⚠️ Important:** Always run `bun run cleanup` before starting new worker processes during development to ensure clean state and avoid conflicts.

## Adding Custom Predicates & Tools

### Add Predicate (< 10 lines)

```typescript
// src/tools/predicates.ts
import type { Predicate } from '../lib/types';

export const predicates: Record<string, Predicate> = {
  // ... existing predicates ...

  myCustom: (data) => {
    const complete = data && data.myField === 'complete';
    return {
      ok: complete,
      msg: complete ? undefined : 'My field not complete'
    };
  }
};
```

### Add Tool (< 10 lines)

```typescript
// src/tools/index.ts
import { defineTool } from './lib/types';

export const tools = {
  // ... existing tools ...

  myTool: defineTool({
    name: 'myTool',
    input: {} as { query: string },
    output: {} as { result: string },
    description: 'My custom tool',
    run: async (input) => {
      return { output: `Processed: ${input.query}` };
    }
  })
};
```

## Spec Examples

### Linear Workflow

```typescript
export default {
  initial: { code: "function foo() {}" },
  steps: [
    {
      name: 'analyze',
      until: 'analyzeDone',
      maxIter: 5,
      tools: ['llm']
    },
    {
      name: 'enhance',
      until: 'scoreCheck',
      maxIter: 3,
      tools: ['llm']
    }
  ]
};
```

### DAG Workflow (parallelism)

```typescript
export default {
  initial: { text: "Hello World" },
  steps: [
    {
      name: 'analyze',
      until: 'analyzeDone',
      maxIter: 5,
      tools: ['llm']
    },
    {
      name: 'summarize',
      dependsOn: ['analyze'],
      until: 'analyzeDone',
      maxIter: 3,
      tools: ['llm']
    },
    {
      name: 'translate',
      dependsOn: ['summarize'],
      until: 'truthy',
      maxIter: 2,
      tools: ['llm']
    }
  ]
};
```

### With Budget

```typescript
export default {
  initial: { text: "Hello" },
  budget: {
    maxTime: 60000,      // 60 seconds
    maxTokens: 10000,
    maxCost: 5           // $5 max
  },
  steps: [
    {
      name: 'analyze',
      until: 'analyzeDone',
      maxIter: 5,
      tools: ['llm']
    }
  ]
};
```

## Architecture

```
User Spec → Validator → DAGExecutor → Tool Registry → Redis/Direct
                      ↓
                Topological Sort
                      ↓
                Concurrency Control
                      ↓
                Budget Enforcement
```

## File Structure

```
daft/
├── src/
│   ├── lib/
│   │   ├── types.ts       # Core types
│   │   ├── runtime.ts     # DAGExecutor
│   │   └── serializer.ts # Spec ↔ JSON
│   ├── tools/
│   │   ├── index.ts       # Tool definitions
│   │   └── predicates.ts  # Predicate definitions
│   └── cli/
│       ├── submit.ts       # Submit to Redis
│       ├── worker.ts       # Worker process
│       ├── logs.ts        # View results/errors
│       └── run-local.ts   # Local execution
├── examples/
│   ├── linear-spec.ts
│   ├── dag-spec.ts
│   └── data.json
├── run.sh                 # Quick test runner
└── README.md
```

## Limitations (v1)

- No diff tracking (planned for v2)
- No web UI (console only)
- No custom tool registry (must be in image)
- No distributed tracing (planned for v2)


## Remote Redis Coordination

Redis-using CLI commands use this pattern:

```sh
const redis = new RedisClient(process.env.REDIS_URL || 'redis://localhost:6379');
```
Just set REDIS_URL to your remote Redis instance:

In .env file:
REDIS_URL=redis://your-redis-host:6379
# Or with authentication
REDIS_URL=redis://username:password@your-redis-host:6379
# Or with TLS
REDIS_URL=rediss://your-redis-host:6379

### Benefits of Remote Redis
1. Distributed Workers - Workers can run anywhere (different machines, cloud services) and all connect to the same Redis queue
2. Scalability - Scale horizontally by adding more workers without coordination
3. Persistence - Redis persists job queue; if workers restart, jobs aren't lost
4. Managed Services - Use Redis Cloud, AWS ElastiCache, or similar managed services
