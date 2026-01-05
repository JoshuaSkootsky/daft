import type { Spec, Step, Budget, Result, StepResult, Usage, Predicate, Tool } from './types';
import { createWideEventLogger, type WideEventLogger, type StepEvent } from './logging';

/**
 * Executes DAFT specs with DAG-based parallelism and budget enforcement.
 *
 * The executor handles:
 * - Topological sorting of steps with dependencies
 * - Parallel execution of independent steps
 * - Iterative execution with predicates
 * - Concurrency control
 * - Budget enforcement (time, tokens, cost)
 * - Automatic error handling and logging
 *
 * @example
 * ```typescript
 * const executor = new DAGExecutor(predicates, tools, 4, logger);
 * const result = await executor.execute(spec);
 * console.log(result.message);
 * ```
 */
export class DAGExecutor {
  private concurrencySlots: number;
  private running: number = 0;
  private stepData: Map<string, any> = new Map();

  /**
   * Create a new DAGExecutor instance.
   *
   * @param predicates - Map of predicate names to predicate functions
   * @param tools - Map of tool names to tool implementations
   * @param concurrency - Maximum number of steps to run in parallel (default: 4)
   * @param logger - Optional logger for structured event logging
   */
  constructor(
    private predicates: Record<string, Predicate>,
    private tools: Record<string, Tool>,
    concurrency: number = 4,
    private logger?: WideEventLogger
  ) {
    this.concurrencySlots = concurrency;
  }

  /**
   * Execute a DAFT spec.
   *
   * Steps are executed in topological order, respecting dependencies.
   * Steps without common dependencies run in parallel up to the concurrency limit.
   * Each step runs iteratively until its predicate is satisfied or maxIter is reached.
   *
   * @param spec - The spec to execute
   * @returns Result object with success status, final data, and per-step results
   *
   * @example
   * ```typescript
   * const result = await executor.execute(spec);
   * if (result.success) {
   *   console.log('Final data:', result.data);
   *   console.log('Usage:', result.usage);
   * }
   * ```
   */
  async execute(spec: Spec): Promise<Result> {
    const startTime = Date.now();
    const totalUsage: Usage = { tokens: 0, cost: 0, duration: 0 };

    this.stepData.clear();
    this.stepData.set('initial', spec.initial);

    const topologicalOrder = this.topoSort(spec.steps);
    const stepResults = new Map<string, StepResult>();
    const stepPromises = new Map<string, Promise<void>>();

    for (const step of topologicalOrder) {
      const promise = this.executeStep(step, spec, totalUsage, startTime, stepPromises)
        .then(result => {
          stepResults.set(step.name, result);
        })
        .catch(error => {
          stepResults.set(step.name, {
            name: step.name,
            iterations: 0,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        });

      stepPromises.set(step.name, promise);
    }

    await Promise.all(stepPromises.values());

    const allSuccessful = Array.from(stepResults.values()).every(r => r.success);
    const finalData = this.getFinalData(stepResults);

    const result: Result = {
      success: allSuccessful,
      data: finalData,
      steps: Array.from(stepResults.values()),
      usage: {
        ...totalUsage,
        duration: Date.now() - startTime
      },
      message: this.formatMessage(allSuccessful, stepResults, totalUsage)
    };

    return result;
  }

  private async executeStep(
    step: Step,
    spec: Spec,
    totalUsage: Usage,
    globalStartTime: number,
    stepPromises: Map<string, Promise<void>>
  ): Promise<StepResult> {
    const stepStartTime = Date.now();
    const stepUsage: Usage = { tokens: 0, cost: 0, duration: 0 };

    let currentData = await this.getCurrentData(step, stepPromises);
    let iteration = 0;

    const predicate = this.predicates[step.until];
    if (!predicate) {
      throw new Error(`Unknown predicate: ${step.until}`);
    }

    try {
      while (iteration < step.maxIter) {
        const check = predicate(currentData);
        if (check.ok) break;

        if (check.msg) {
          console.log(`  [${step.name}] Iteration ${iteration + 1}: ${check.msg}`);
        } else {
          console.log(`  [${step.name}] Iteration ${iteration + 1}`);
        }

        for (const toolName of step.tools) {
          const tool = this.tools[toolName];
          if (!tool) {
            throw new Error(`Unknown tool: ${toolName}`);
          }

          const result = await tool.run(currentData);
          currentData = this.mergeData(currentData, result.output);

          if (result.usage) {
            stepUsage.tokens += result.usage.tokens || 0;
            stepUsage.cost += result.usage.cost || 0;
            totalUsage.tokens += result.usage.tokens || 0;
            totalUsage.cost += result.usage.cost || 0;
          }
        }

        this.stepData.set(step.name, currentData);
        iteration++;

        this.checkBudget(spec.budget, totalUsage, globalStartTime);
        await this.waitForConcurrencySlot();

        const checkAfter = predicate(currentData);
        if (checkAfter.ok) break;
      }

      const finalCheck = predicate(currentData);
      stepUsage.duration = Date.now() - stepStartTime;
      this.stepData.set(step.name, currentData);

      if (!finalCheck.ok) {
        const stepEvent: StepEvent = {
          name: step.name,
          iterations: iteration,
          success: false,
          duration_ms: stepUsage.duration,
          tokens_used: stepUsage.tokens,
          cost_usd: stepUsage.cost,
          tools_used: step.tools,
          predicate: step.until,
          error: {
            message: finalCheck.msg || `Failed after ${iteration} iterations`,
            iteration,
          }
        };

        if (this.logger) {
          this.logger.addStep(stepEvent);
        }

        return {
          name: step.name,
          iterations: iteration,
          success: false,
          error: finalCheck.msg || `Failed after ${iteration} iterations`,
          usage: stepUsage
        };
      }

      const stepEvent: StepEvent = {
        name: step.name,
        iterations: iteration,
        success: true,
        duration_ms: stepUsage.duration,
        tokens_used: stepUsage.tokens,
        cost_usd: stepUsage.cost,
        tools_used: step.tools,
        predicate: step.until,
      };

      if (this.logger) {
        this.logger.addStep(stepEvent);
      }

      return {
        name: step.name,
        iterations: iteration,
        success: true,
        usage: stepUsage
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      const stepEvent: StepEvent = {
        name: step.name,
        iterations: iteration,
        success: false,
        duration_ms: Date.now() - stepStartTime,
        tokens_used: stepUsage.tokens,
        cost_usd: stepUsage.cost,
        tools_used: step.tools,
        predicate: step.until,
        error: {
          message: errorMessage,
          iteration,
        }
      };

      if (this.logger) {
        this.logger.addStep(stepEvent);
      }

      return {
        name: step.name,
        iterations: iteration,
        success: false,
        error: errorMessage,
        usage: stepUsage
      };
    }
  }

  private topoSort(steps: Step[]): Step[] {
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    for (const step of steps) {
      inDegree.set(step.name, 0);
      graph.set(step.name, []);
    }

    for (const step of steps) {
      for (const dep of step.dependsOn || []) {
        if (!graph.has(dep)) {
          throw new Error(`Unknown dependency: ${dep}`);
        }
        graph.get(dep)!.push(step.name);
        inDegree.set(step.name, (inDegree.get(step.name) || 0) + 1);
      }
    }

    const queue: Step[] = [];
    const result: Step[] = [];
    const stepMap = new Map(steps.map(s => [s.name, s]));

    for (const [name, degree] of inDegree) {
      if (degree === 0) {
        queue.push(stepMap.get(name)!);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      for (const dependent of graph.get(current.name) || []) {
        const newDegree = (inDegree.get(dependent) || 0) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) {
          queue.push(stepMap.get(dependent)!);
        }
      }
    }

    if (result.length !== steps.length) {
      throw new Error('Circular dependency detected in steps');
    }

    return result;
  }

  private async waitForConcurrencySlot(): Promise<void> {
    while (this.running >= this.concurrencySlots) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    this.running++;
    return new Promise<void>(resolve => setTimeout(() => {
      this.running--;
      resolve(undefined);
    }, 0));
  }

  private checkBudget(budget: Budget | undefined, usage: Usage, startTime: number): void {
    if (!budget) return;

    const elapsed = Date.now() - startTime;
    if (budget.maxTime && elapsed > budget.maxTime) {
      throw new Error(`Budget exceeded: time limit of ${budget.maxTime}ms`);
    }

    if (budget.maxTokens && usage.tokens > budget.maxTokens) {
      throw new Error(`Budget exceeded: token limit of ${budget.maxTokens}`);
    }

    if (budget.maxCost && usage.cost > budget.maxCost) {
      throw new Error(`Budget exceeded: cost limit of $${budget.maxCost}`);
    }
  }

  private mergeData(base: any, update: any): any {
    if (typeof base === 'object' && base !== null && typeof update === 'object' && update !== null) {
      return { ...base, ...update };
    }
    return update;
  }

  private async getCurrentData(step: Step, stepPromises: Map<string, Promise<void>>): Promise<any> {
    if (step.dependsOn && step.dependsOn.length > 0) {
      for (const dep of step.dependsOn) {
        const depPromise = stepPromises.get(dep);
        if (depPromise) {
          await depPromise;
        }
      }
      let merged: any = {};
      for (const dep of step.dependsOn) {
        const depData = this.stepData.get(dep);
        if (depData !== undefined) {
          merged = this.mergeData(merged, depData);
        }
      }
      return merged;
    }
    return this.stepData.get('initial') || {};
  }

  private getFinalData(stepResults: Map<string, StepResult>): any {
    const lastSuccessful = Array.from(stepResults.values()).reverse().find(r => r.success);
    if (lastSuccessful && lastSuccessful.name !== 'initial') {
      return this.stepData.get(lastSuccessful.name);
    }
    return this.stepData.get('initial');
  }

  private formatMessage(success: boolean, stepResults: Map<string, StepResult>, usage: Usage): string {
    const totalIterations = Array.from(stepResults.values()).reduce((sum, r) => sum + r.iterations, 0);
    const stepsCount = stepResults.size;
    
    if (success) {
      return `✅ Done in ${totalIterations} iterations across ${stepsCount} step${stepsCount > 1 ? 's' : ''}`;
    } else {
      const failedSteps = Array.from(stepResults.values()).filter(r => !r.success);
      return `❌ Failed: ${failedSteps.length} step${failedSteps.length > 1 ? 's' : ''} failed`;
    }
  }
}
