export interface Spec {
  initial: unknown;
  steps: Step[];
  budget?: Budget;
}

export interface Step {
  name: string;
  until: string;
  maxIter: number;
  tools: string[];
  dependsOn?: string[];
}

export interface Budget {
  maxTime?: number;
  maxTokens?: number;
  maxCost?: number;
}

export interface Result {
  success: boolean;
  data?: unknown;
  error?: string;
  steps: StepResult[];
  usage?: Usage;
  message: string;
}

export interface StepResult {
  name: string;
  iterations: number;
  success: boolean;
  error?: string;
  usage?: Usage;
}

export interface Usage {
  tokens: number;
  cost: number;
  duration: number;
}

export interface Predicate {
  (data: unknown): { ok: boolean; msg?: string };
}

export type PredicateFunction = (data: unknown) => { ok: boolean; msg?: string };
export type PredicateFactory = (...args: any[]) => PredicateFunction;

export interface Tool<I = any, O = any> {
  name: string;
  input: I;
  output: O;
  description?: string;
  run: (input: I) => Promise<{ output: O; usage?: Partial<Usage> }>;
}

export interface ToolConfig<I, O> {
  name: string;
  input: I;
  output: O;
  description?: string;
  run: (input: I) => Promise<{ output: O; usage?: Partial<Usage> }>;
}
