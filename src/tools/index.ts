import type { Tool, ToolConfig } from '../lib/types';

/**
 * Define a tool with proper TypeScript types.
 *
 * This is a type-safe helper for creating tools.
 * The function preserves the input/output types from the config.
 *
 * @typeParam I - Input type for the tool
 * @typeParam O - Output type for the tool
 * @param config - Tool configuration
 * @returns A fully-typed Tool object
 *
 * @example
 * ```typescript
 * const myTool = defineTool({
 *   name: 'summarize',
 *   input: {} as { text: string },
 *   output: {} as { summary: string },
 *   description: 'Summarize text',
 *   run: async (input) => {
 *     return { output: { summary: input.text.substring(0, 50) } };
 *   }
 * });
 * ```
 */
export function defineTool<I, O>(config: ToolConfig<I, O>): Tool<I, O> {
  return config as any;
}

/**
 * Registry of built-in tools.
 *
 * Includes:
 * - `llm` - Call OpenCode Zen LLM
 * - `echo` - Test tool that returns data with modifications
 */
export const tools: Record<string, Tool> = {
  /**
   * LLM tool for calling OpenCode Zen API.
   *
   * Supports multiple models through the OpenCode Zen endpoint.
   * Requires ZEN_API_KEY environment variable.
   *
   * @example
   * ```typescript
   * const result = await tools.llm.run({
   *   prompt: 'Write a function to add two numbers',
   *   model: 'grok-code'
   * });
   * ```
   */
  llm: defineTool({
    name: 'llm',
    input: {} as { prompt: string; model?: string },
    output: {} as { output: string; tokens: number },
    description: 'Call OpenCode Zen LLM',
    run: async (input) => {
      const startTime = Date.now();
      const apiKey = process.env.ZEN_API_KEY || '';
      const model = input.model || 'grok-code';
      const endpoint = 'https://opencode.ai/zen/v1/chat/completions';

      if (!apiKey) {
        throw new Error('ZEN_API_KEY environment variable is required for LLM tool');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: input.prompt }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const tokens = result.usage?.total_tokens || 0;

      return {
        output: {
          output: result.choices[0].message.content
        },
        usage: {
          tokens,
          cost: calculateCost(tokens, model),
          duration: Date.now() - startTime
        }
      };
    }
  }),

  /**
   * Echo tool for testing purposes.
   *
   * Echoes input back with modifications based on step name.
   * Useful for testing without making actual LLM API calls.
   *
   * Behavior by step name:
   * - `summarize` - Adds summary field
   * - `extract_entities` - Adds entities array
   * - `categorize` - Adds category field
   * - Other steps - Adds analysis field and increments score
   *
   * @example
   * ```typescript
   * const result = await tools.echo.run({ text: 'Hello', stepName: 'summarize' });
   * // Returns: { text: 'Hello', summary: '...' }
   * ```
   */
  echo: defineTool({
    name: 'echo',
    input: {} as any,
    output: {} as any,
    description: 'Echo input back with modifications for testing',
    run: async (input) => {
      const result: any = {};

      if (input && typeof input === 'object') {
        Object.assign(result, input);
      }

      const stepName = (input as any).stepName || 'unknown';

      if (stepName === 'summarize') {
        result.summary = 'Document describes a fox jumping over a lazy dog.';
      } else if (stepName === 'extract_entities') {
        result.entities = ['fox', 'dog', 'jumping', 'lazy'];
      } else if (stepName === 'categorize') {
        result.category = 'Animals';
      } else {
        result.analysis = 'complete';
        if (!('score' in result) || typeof result.score !== 'number') {
          result.score = 85;
        } else {
          result.score = result.score + 10;
        }
      }

      return {
        output: result,
        usage: { tokens: 0, cost: 0, duration: 0 }
      };
    }
  })
};

function calculateCost(tokens: number, model: string): number {
  const rates: Record<string, { input: number; output: number }> = {
    'grok-code': { input: 0, output: 0 },
    'gpt-5.1-codex-mini': { input: 0.00025, output: 0.002 },
    'claude-3-5-haiku': { input: 0.0008, output: 0.004 }
  };

  const rate = rates[model] || { input: 0.001, output: 0.01 };
  return (tokens / 1000) * (rate.input + rate.output) / 2;
}
