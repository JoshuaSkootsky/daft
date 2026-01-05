export interface WideEvent {
  timestamp: string;
  service: string;
  version: string;
  deployment_id?: string;
  region?: string;

  execution_id: string;
  trace_id?: string;

  spec: {
    file: string;
    steps_count: number;
    predicates: string[];
    tools: string[];
    budget?: {
      max_time_ms?: number;
      max_tokens?: number;
      max_cost?: number;
    };
  };

  execution: {
    mode: 'local' | 'distributed';
    outcome: 'success' | 'error' | 'budget_exceeded' | 'partial';
    duration_ms: number;
    total_iterations: number;
    steps: StepEvent[];
  };

  usage: {
    tokens: number;
    cost_usd: number;
    tool_calls: number;
  };

  environment: {
    node_version: string;
    bun_version: string;
    redis_connected: boolean;
    zen_api_key_configured: boolean;
  };

  error?: {
    type: string;
    message: string;
    code?: string;
    retriable: boolean;
    step?: string;
  };

  user?: {
    id?: string;
    tier?: string;
  };
}

export interface StepEvent {
  name: string;
  iterations: number;
  success: boolean;
  duration_ms: number;
  tokens_used: number;
  cost_usd: number;
  tools_used: string[];
  predicate?: string;
  error?: {
    message: string;
    iteration?: number;
  };
}

export class WideEventLogger {
  private event: Partial<WideEvent> = {};
  private steps: StepEvent[] = [];
  private emitted = false;

  constructor(
    private executionId: string,
    private traceId?: string
  ) {
    this.initializeBase();
  }

  private initializeBase() {
    this.event = {
      timestamp: new Date().toISOString(),
      service: 'daft',
      version: process.env.npm_package_version || '1.0.0',
      deployment_id: process.env.DEPLOYMENT_ID,
      region: process.env.REGION || 'local',
      execution_id: this.executionId,
      trace_id: this.traceId,
      environment: {
        node_version: process.version,
        bun_version: Bun.version,
        redis_connected: false,
        zen_api_key_configured: !!process.env.ZEN_API_KEY,
      },
    };
  }

  setSpec(spec: {
    file: string;
    steps_count: number;
    predicates: string[];
    tools: string[];
    budget?: any;
  }) {
    this.event.spec = spec;
  }

  setExecutionMode(mode: 'local' | 'distributed') {
    if (!this.event.execution) {
      this.event.execution = {
        mode,
        outcome: 'success',
        duration_ms: 0,
        total_iterations: 0,
        steps: [],
      };
    } else {
      this.event.execution.mode = mode;
    }
  }

  addStep(step: StepEvent) {
    this.steps.push(step);
  }

  setUsage(usage: { tokens: number; cost_usd: number; tool_calls: number }) {
    this.event.usage = usage;
  }

  setError(error: {
    type: string;
    message: string;
    code?: string;
    retriable: boolean;
    step?: string;
  }) {
    this.event.error = error;
    this.event.execution!.outcome = 'error';
  }

  setOutcome(outcome: 'success' | 'error' | 'budget_exceeded' | 'partial') {
    if (this.event.execution) {
      this.event.execution.outcome = outcome;
    }
  }

  setDuration(durationMs: number) {
    if (this.event.execution) {
      this.event.execution.duration_ms = durationMs;
    }
  }

  setTotalIterations(total: number) {
    if (this.event.execution) {
      this.event.execution.total_iterations = total;
    }
  }

  finalize() {
    const totalIterations = this.steps.reduce((sum, s) => sum + s.iterations, 0);
    const totalDuration = this.steps.reduce((sum, s) => sum + s.duration_ms, 0);
    const totalTokens = this.steps.reduce((sum, s) => sum + s.tokens_used, 0);
    const totalCost = this.steps.reduce((sum, s) => sum + s.cost_usd, 0);
    const totalToolCalls = this.steps.reduce((sum, s) => sum + s.tools_used.length, 0);

    this.setTotalIterations(totalIterations);
    this.setDuration(totalDuration);

    if (!this.event.usage) {
      this.setUsage({
        tokens: totalTokens,
        cost_usd: totalCost,
        tool_calls: totalToolCalls,
      });
    }

    this.event.execution!.steps = this.steps;
    this.event.execution!.duration_ms = totalDuration;
  }

  private shouldEmit(): boolean {
    const event = this.event;

    if (!event.execution) return true;

    const outcome = event.execution.outcome;
    const duration = event.execution.duration_ms || 0;
    const cost = event.usage?.cost_usd || 0;

    const alwaysEmit = process.env.DAFT_ALWAYS_EMIT === 'true';

    if (alwaysEmit) return true;
    if (outcome !== 'success') return true;
    if (duration > 5000) return true;
    if (cost > 0.01) return true;

    return Math.random() < 0.5;
  }

  emit(): WideEvent | null {
    if (this.emitted) {
      return this.event as WideEvent;
    }

    this.finalize();

    if (!this.shouldEmit()) {
      this.emitted = true;
      return null;
    }

    this.emitted = true;
    console.log(JSON.stringify(this.event));
    return this.event as WideEvent;
  }

  emitAlways(): WideEvent {
    process.env.DAFT_ALWAYS_EMIT = 'true';
    const emitted = this.emit();
    delete process.env.DAFT_ALWAYS_EMIT;
    return emitted || this.event as WideEvent;
  }
}

export function createWideEventLogger(executionId: string, traceId?: string) {
  return new WideEventLogger(executionId, traceId);
}

export function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
