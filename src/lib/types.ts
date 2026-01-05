/**
 * A DAFT spec defines a declarative workflow for data transformation.
 *
 * @example
 * ```typescript
 * const spec: Spec = {
 *   initial: { text: "Hello World" },
 *   steps: [
 *     {
 *       name: 'analyze',
 *       until: 'analyzeDone',
 *       maxIter: 5,
 *       tools: ['llm']
 *     }
 *   ],
 *   budget: { maxTime: 60000, maxTokens: 1000 }
 * };
 * ```
 */
export interface Spec {
  /**
   * Initial data to start the workflow with.
   * Can be any JSON-serializable value or object.
   */
  initial: unknown;

  /**
   * Ordered list of steps to execute.
   * Steps are executed in topological order, respecting dependencies.
   */
  steps: Step[];

  /**
   * Optional budget constraints for the entire execution.
   * If any budget limit is exceeded, execution will fail.
   */
  budget?: Budget;
}

/**
 * A step in the DAFT workflow.
 *
 * Steps are executed iteratively until a predicate is satisfied or maxIter is reached.
 * Steps with dependencies will wait for those dependencies to complete before starting.
 *
 * @example
 * ```typescript
 * const step: Step = {
 *   name: 'analyze',
 *   until: 'analyzeDone',
 *   maxIter: 5,
 *   tools: ['llm'],
 *   dependsOn: ['preprocess']
 * };
 * ```
 */
export interface Step {
  /**
   * Unique identifier for this step.
   * Used for logging, dependency tracking, and error messages.
   */
  name: string;

  /**
   * Name of the predicate that determines when this step is complete.
   * The predicate is evaluated after each iteration.
   *
   * @see Predicate
   */
  until: string;

  /**
   * Maximum number of iterations to run this step.
   * If the predicate is not satisfied before this limit, the step fails.
   */
  maxIter: number;

  /**
   * List of tools to execute in each iteration.
   * Tools are run in sequence, and their outputs are merged into the data.
   *
   * @see Tool
   */
  tools: string[];

  /**
   * Optional list of step names this step depends on.
   * This step will wait for all dependencies to complete before starting.
   * Enables DAG-based parallelism - steps without common dependencies run in parallel.
   */
  dependsOn?: string[];
}

/**
 * Budget constraints for spec execution.
 *
 * Any exceeded budget will cause the execution to fail immediately.
 * Budget is checked after each tool execution.
 *
 * @example
 * ```typescript
 * const budget: Budget = {
 *   maxTime: 60000,      // 60 seconds
 *   maxTokens: 10000,
 *   maxCost: 5           // $5 USD
 * };
 * ```
 */
export interface Budget {
  /**
   * Maximum execution time in milliseconds.
   * If not specified, no time limit is enforced.
   */
  maxTime?: number;

  /**
   * Maximum number of tokens to use across all LLM calls.
   * If not specified, no token limit is enforced.
   */
  maxTokens?: number;

  /**
   * Maximum cost in USD.
   * If not specified, no cost limit is enforced.
   */
  maxCost?: number;
}

/**
 * The result of executing a DAFT spec.
 *
 * Contains the final data, per-step results, usage statistics, and status.
 *
 * @example
 * ```typescript
 * const result = await executor.execute(spec);
 * if (result.success) {
 *   console.log('Final data:', result.data);
 *   console.log('Total tokens:', result.usage?.tokens);
 * }
 * ```
 */
export interface Result {
  /**
   * Whether the entire spec execution succeeded.
   * All steps must succeed for this to be true.
   */
  success: boolean;

  /**
   * The final data after all steps completed.
   * Only present if execution was successful.
   */
  data?: unknown;

  /**
   * Error message if execution failed.
   * Only present if success is false.
   */
  error?: string;

  /**
   * Results for each step in the spec.
   * Ordered by execution order (topological sort).
   */
  steps: StepResult[];

  /**
   * Total usage statistics across all steps.
   * Only present if at least one tool reported usage.
   */
  usage?: Usage;

  /**
   * Human-readable summary message.
   * Includes iteration count, step count, and failure details.
   */
  message: string;
}

/**
 * The result of executing a single step.
 *
 * @example
 * ```typescript
 * const stepResult: StepResult = {
 *   name: 'analyze',
 *   iterations: 3,
 *   success: true,
 *   usage: { tokens: 500, cost: 0.001, duration: 1200 }
 * };
 * ```
 */
export interface StepResult {
  /**
   * The name of the step that was executed.
   */
  name: string;

  /**
   * Number of iterations run before the predicate was satisfied or maxIter was reached.
   */
  iterations: number;

  /**
   * Whether the step completed successfully.
   * False if the predicate was not satisfied within maxIter, or if an error occurred.
   */
  success: boolean;

  /**
   * Error message if the step failed.
   * Only present if success is false.
   */
  error?: string;

  /**
   * Usage statistics for this step only.
   * Accumulated across all iterations.
   */
  usage?: Usage;
}

/**
 * Resource usage statistics.
 *
 * Used to track and budget LLM tokens, cost, and execution time.
 *
 * @example
 * ```typescript
 * const usage: Usage = {
 *   tokens: 1500,
 *   cost: 0.0023,
 *   duration: 5432
 * };
 * ```
 */
export interface Usage {
  /**
   * Total number of tokens used (input + output).
   */
  tokens: number;

  /**
   * Total cost in USD.
   */
  cost: number;

  /**
   * Total duration in milliseconds.
   */
  duration: number;
}

/**
 * A predicate function that determines when a step should stop iterating.
 *
 * The predicate is evaluated after each iteration with the current data.
 * Returns an object with ok (success) and optional msg (failure reason).
 *
 * @example
 * ```typescript
 * const analyzeDone: Predicate = (data) => {
 *   const hasAnalysis = data && typeof data === 'object' && 'analysis' in data;
 *   return {
 *     ok: hasAnalysis,
 *     msg: hasAnalysis ? undefined : 'No analysis found'
 *   };
 * };
 * ```
 */
export interface Predicate {
  /**
   * Evaluate the predicate with the current data.
   *
   * @param data - The current data state
   * @returns Object with ok (true if predicate satisfied) and optional msg (why not satisfied)
   */
  (data: unknown): { ok: boolean; msg?: string };
}

/**
 * Type alias for a predicate function.
 *
 * @deprecated Use Predicate interface instead
 */
export type PredicateFunction = (data: unknown) => { ok: boolean; msg?: string };

/**
 * Type alias for a predicate factory function.
 *
 * Used to create predicates with parameters.
 *
 * @deprecated Use direct Predicate functions instead
 */
export type PredicateFactory = (...args: any[]) => PredicateFunction;

/**
 * A tool is a function that transforms data.
 *
 * Tools are executed by steps and can report usage (tokens, cost, duration).
 *
 * @typeParam I - Input type for the tool
 * @typeParam O - Output type for the tool
 *
 * @example
 * ```typescript
 * const tool: Tool<{ text: string }, { summary: string }> = {
 *   name: 'summarize',
 *   input: { text: '' },
 *   output: { summary: '' },
 *   description: 'Summarize the input text',
 *   run: async (input) => {
 *     return {
 *       output: { summary: input.text.substring(0, 100) },
 *       usage: { tokens: 50, cost: 0, duration: 100 }
 *     };
 *   }
 * };
 * ```
 */
export interface Tool<I = any, O = any> {
  /**
   * Unique identifier for this tool.
   * Referenced by name in step.tools arrays.
   */
  name: string;

  /**
   * Type signature for input data.
   * Used for type-checking and documentation.
   */
  input: I;

  /**
   * Type signature for output data.
   * Used for type-checking and documentation.
   */
  output: O;

  /**
   * Human-readable description of what this tool does.
   */
  description?: string;

  /**
   * Execute the tool with the given input.
   *
   * @param input - The data to transform
   * @returns Object with output data and optional usage statistics
   */
  run: (input: I) => Promise<{ output: O; usage?: Partial<Usage> }>;
}

/**
 * Configuration object for creating a tool.
 *
 * Used with the defineTool helper function.
 *
 * @typeParam I - Input type for the tool
 * @typeParam O - Output type for the tool
 *
 * @example
 * ```typescript
 * const tool = defineTool({
 *   name: 'summarize',
 *   input: {} as { text: string },
 *   output: {} as { summary: string },
 *   description: 'Summarize text',
 *   run: async (input) => ({ output: { summary: input.text.slice(0, 100) } })
 * });
 * ```
 */
export interface ToolConfig<I, O> {
  /**
   * Unique identifier for this tool.
   */
  name: string;

  /**
   * Type signature for input data.
   */
  input: I;

  /**
   * Type signature for output data.
   */
  output: O;

  /**
   * Human-readable description.
   */
  description?: string;

  /**
   * Function to execute the tool.
   */
  run: (input: I) => Promise<{ output: O; usage?: Partial<Usage> }>;
}
