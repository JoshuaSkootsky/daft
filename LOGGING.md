# DAFT Logging Philosophy

This document describes DAFT's logging approach, based on the wide event / canonical log line philosophy from [loggingsucks.com](https://loggingsucks.com/).

## Core Principle

**One wide event per execution** - Instead of scattering console.log statements throughout the code, DAFT emits a single, comprehensive structured log event per spec execution that contains all context needed for debugging and analytics.

## Why This Approach

Traditional logging is broken for distributed systems. When a user reports an issue, grep-ing through thousands of log lines is inefficient. The problem is that logs are optimized for *writing*, not for *querying*.

Wide events fix this by:
- **High dimensionality**: 20+ fields per event
- **High cardinality**: Request IDs, user IDs, trace IDs
- **Business context**: Spec details, tools used, predicates applied
- **Structure**: JSON that can be queried, not strings that must be grepped

## Implementation

### WideEventLogger Class

Located in `src/lib/logging.ts`, this class builds a comprehensive event throughout the execution lifecycle:

```typescript
import { createWideEventLogger, generateExecutionId } from '../lib/logging';

const executionId = generateExecutionId();
const logger = createWideEventLogger(executionId);

logger.setSpec({
  file: specPath,
  steps_count: spec.steps.length,
  predicates: spec.steps.map(s => s.until),
  tools: [...new Set(spec.steps.flatMap(s => s.tools))],
  budget: spec.budget,
});

logger.setExecutionMode('local');

// Steps are added automatically by DAGExecutor
// Set error if something fails
logger.setError({
  type: 'BudgetExceededError',
  message: 'Budget exceeded: cost limit of $0.001',
  code: 'BUDGET_EXCEEDED',
  retriable: false,
  step: 'explain',
});

// Emit the final wide event
logger.emit();
```

### Event Structure

A wide event contains:

```typescript
{
  "timestamp": "2025-01-05T12:30:45.612Z",
  "service": "daft",
  "version": "1.0.0",
  "execution_id": "exec_1704473445612_abc123xyz",
  "trace_id": "trace_1704473445612_def456uvw",

  "spec": {
    "file": "examples/llm-spec.ts",
    "steps_count": 2,
    "predicates": ["hasOutput", "scoreCheck"],
    "tools": ["llm", "echo"],
    "budget": { "max_time_ms": 30000, "max_tokens": 1000 }
  },

  "execution": {
    "mode": "local",
    "outcome": "success",
    "duration_ms": 1247,
    "total_iterations": 3,
    "steps": [
      {
        "name": "explain",
        "iterations": 1,
        "success": true,
        "duration_ms": 892,
        "tokens_used": 751,
        "cost_usd": 0,
        "tools_used": ["llm"],
        "predicate": "hasOutput"
      }
    ]
  },

  "usage": {
    "tokens": 751,
    "cost_usd": 0,
    "tool_calls": 1
  },

  "environment": {
    "node_version": "v20.0.0",
    "bun_version": "1.3.5",
    "redis_connected": true,
    "zen_api_key_configured": true
  },

  "error": {  // Only present on failure
    "type": "BudgetExceededError",
    "message": "Budget exceeded: cost limit of $0.001",
    "code": "BUDGET_EXCEEDED",
    "retriable": false,
    "step": "explain"
  }
}
```

## Integration Points

### DAGExecutor

The executor accepts a `logger` parameter and automatically records:

```typescript
const logger = createWideEventLogger(executionId);
const executor = new DAGExecutor(predicates, tools, 4, logger);
```

Each step execution is automatically logged with:
- Iteration count
- Success/failure
- Tokens used
- Cost incurred
- Tools invoked
- Predicate evaluated

### CLI Scripts

Each CLI entry point should:
1. Create a logger at the start
2. Pass it to the executor
3. Emit the final event before exit

```typescript
// run-local.ts, worker.ts, submit.ts
const logger = createWideEventLogger(executionId, traceId);
logger.setExecutionMode('local' | 'distributed');
// ... execution ...
logger.emit();
```

## Querying Wide Events

With structured events, you can run powerful queries:

```bash
# Find all executions that exceeded token budget
jq 'select(.execution.outcome == "budget_exceeded")' logs.json

# Find all executions with llm tool calls
jq 'select(.execution.steps[].tools_used[] == "llm")' logs.json

# Find all failed executions
jq 'select(.execution.outcome != "success")' logs.json

# Find all executions with high token usage (> 1000)
jq 'select(.usage.tokens > 1000)' logs.json

# Find all executions for a specific trace ID
jq 'select(.trace_id == "trace_...")' logs.json
```

## Sampling for Cost Control

At production scale, emitting wide events for every execution can be expensive. Implement tail sampling:

```typescript
function shouldEmit(logger: WideEventLogger): boolean {
  const event = logger.build();
  
  // Always emit errors
  if (event.execution.outcome !== 'success') return true;
  
  // Always emit slow executions
  if (event.execution.duration_ms > 5000) return true;
  
  // Always emit high-cost executions
  if (event.usage.cost_usd > 0.01) return true;
  
  // Sample happy path at 5%
  return Math.random() < 0.05;
}

if (shouldEmit(logger)) {
  logger.emit();
}
```

## Best Practices

### DO:

- Emit one wide event per execution
- Include all business context (spec details, tools, predicates)
- Use high-cardinality fields (execution_id, trace_id)
- Capture both success and failure paths
- Include environment metadata
- Structure data as JSON from the start

### DON'T:

- Scattered console.log statements throughout code
- Log vague messages like "Processing..." or "Done"
- Mix structured and unstructured logs
- Log only errors
- Use string-based logging ("User user-123 failed")
- Rely on grep for debugging

## Migration Guide

When adding new features, ask:

1. **What business event is happening?** (spec execution, job submission, etc.)
2. **What context will someone need to debug this?** (user ID, spec details, errors)
3. **What fields enable queries?** (status, cost, duration, tools used)
4. **Should this be sampled?** (is this a common happy path?)

Example migration:

```typescript
// BEFORE: Scattered console.logs
console.log('Loading spec:', specPath);
console.log('Steps:', spec.steps.length);
console.log('Executing...');
console.log('Result:', JSON.stringify(result));

// AFTER: Single wide event
const logger = createWideEventLogger(executionId);
logger.setSpec({ file: specPath, steps_count: spec.steps.length, ... });
logger.setExecutionMode('local');
// ... execute ...
logger.emit();
```

## Troubleshooting

### Stale Workers

During development, DAFT worker processes may become stale or unresponsive. Clean them up:

```bash
bun run cleanup
```

This script:
- Finds all `bun src/cli/worker.ts` processes
- Gracefully stops them with SIGTERM
- Force-stops any remaining with SIGKILL
- Reports cleanup status

**For AI Agents:** Always run `bun run cleanup` before starting new worker processes to ensure clean state.

If the script fails, manually clean up:

```bash
pkill -f "bun src/cli/worker.ts"
```

## References

- [Logging Sucks](https://loggingsucks.com/) - The philosophy behind this approach
- [Stripe's logging guide](https://stripe.com/blog/canonical-log-lines) - Original canonical log line concept
- [Structured logging in Node.js](https://github.com/pinojs/pino) - Implementation patterns

## Questions?

See the `src/lib/logging.ts` implementation for details, or check `loggingsucks.com` for the full philosophy.
