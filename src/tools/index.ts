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
 * - `mockLLM` - Test tool that returns mock data from spec's _mock object
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

      if (!apiKey) {
        throw new Error('ZEN_API_KEY environment variable is required for LLM tool');
      }

      const models = ['grok-code', 'glm-4.7-free', 'minimax-m2.1-free', 'gpt-5-nano'];
      const model = input.model || 'grok-code';

      const endpoint = 'https://opencode.ai/zen/v1/chat/completions';

      for (const m of models) {
        try {
          const { _mock, ...rest } = input as any;
          const prompt = input.prompt || input.transcript || input.text || JSON.stringify(rest);
          const promptLength = prompt.length;

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30000);

          let response;
          try {
            response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: m,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
              }),
              signal: controller.signal
            });
            clearTimeout(timeout);
          } catch (fetchError) {
            console.log(`Model ${m} [${promptLength} chars] timeout or network error`);
            continue;
          }

          if (!response.ok) {
            const errorText = await response.text();
            console.log(`Model ${m} [${promptLength} chars] ${response.status}: ${errorText.substring(0, 100)}`);
            continue;
          }

          const responseText = await response.text();

          try {
            var result = JSON.parse(responseText);
          } catch (parseError) {
            console.log(`Model ${m} [${promptLength} chars] parse error: ${responseText.substring(0, 100)}`);
            continue;
          }

          if (!result.choices || !result.choices[0] || !result.choices[0].message) {
            console.log(`Model ${m} [${promptLength} chars] invalid response`);
            continue;
          }

          const tokens = result.usage?.total_tokens || result.usage?.prompt_tokens + result.usage?.completion_tokens || 0;
          const content = result.choices[0].message.content;

          console.log(`Model ${m} [${promptLength} chars] success: ${content.substring(0, 100)} (${tokens} tokens)`);

          const extracted: any = {};

          const lowerContent = content.toLowerCase();

          const repoMatch = content.match(/### repository overview:\s*(skootsky\/daft)(?=\s|$)/is);
          if (repoMatch) {
            extracted.repository = 'skootsky/daft';
          }

          const sectionMatch = content.match(/### (?:repository overview|security analysis|performance analysis|style analysis)[^:]*:\s*(.+?)(?=\s|$)/is);
          if (sectionMatch) {
            const sectionName = sectionMatch[1].split(/\s+/)[0].toLowerCase();
            const sectionStart = sectionMatch.index! + sectionMatch[0]!.length;
            let sectionEnd = content.indexOf('\n\n', sectionStart);

            if (sectionEnd === -1) {
              sectionEnd = content.length;
            }

            const sectionContent = content.substring(sectionStart, sectionEnd);

            if (lowerContent.includes('style analysis')) {
              const styleMatch = sectionContent.match(/[-•]\s*\*(.+?)\*\*/gm);
              if (styleMatch) {
                extracted.style_issues = styleMatch.map((s: string) => s.replace(/[-•]\s*\*|\*\*/g, '').trim());
              }
            }

            if (lowerContent.includes('security analysis')) {
              const securityMatch = sectionContent.match(/[-•]\s*\*(.+?)\*\*/gm);
              if (securityMatch) {
                extracted.security_issues = securityMatch.map((s: string) => s.replace(/[-•]\s*\*|\*\*/g, '').trim());
              }
            }

            if (lowerContent.includes('performance analysis')) {
              const performanceMatch = sectionContent.match(/[-•]\s*\*(.+?)\*\*/gm);
              if (performanceMatch) {
                extracted.performance_issues = performanceMatch.map((p: string) => p.replace(/[-•]\s*\*|\*\*/g, '').trim());
              }
            }
          }

          const recMatch = content.match(/### recommendations[^:]*:\s*(.+?)(?=\s|$)/is);
          if (recMatch) {
            const recStart = recMatch.index! + recMatch[0]!.length;
            let recEnd = content.indexOf('\n\n', recStart);

            if (recEnd === -1) {
              recEnd = content.length;
            }

            extracted.recommendations = content.substring(recStart, recEnd).match(/[-•]\s*\*(.+?)\*\*/gm)?.map((r: string) => r.replace(/[-•]\s*\*|\*\*/g, '').trim());
          }

          if (Object.keys(extracted).length > 0) {
            return {
              output: extracted,
              usage: {
                tokens,
                cost: calculateCost(tokens, m),
                duration: Date.now() - startTime
              }
            };
          }

          return {
            output: extracted,
            usage: {
              tokens,
              cost: calculateCost(tokens, m),
              duration: Date.now() - startTime
            }
          };
          }

          return {
            output: extracted,
            usage: {
              tokens,
              cost: calculateCost(tokens, m),
              duration: Date.now() - startTime
            }
          };
        } catch (error) {
          console.log(`Model ${m} error: ${error instanceof Error ? error.message : String(error)}`);
          continue;
        }
      }

      throw new Error(`All models failed. Check ZEN_API_KEY and API status.`);
    }
  }),

  /**
   * Mock LLM tool for testing purposes.
   *
   * Returns mock behavior defined in spec's initial._mock object.
   * Useful for testing workflows without making actual LLM API calls.
   *
   * @example
   * ```typescript
   * // Define mock behavior in initial data:
   * initial: {
   *   _mock: {
   *     cheap_summary: { cheap_summary: 'Quick overview...' },
   *     deep_summary: { deep_summary: 'Detailed analysis...' }
   *   }
   * }
   *
   * // Use in spec:
   * {
   *   name: 'cheap_summary',
   *   until: 'truthy',
   *   tools: ['mockLLM']
   * }
   * ```
   */
  mockLLM: defineTool({
    name: 'mockLLM',
    input: {} as any,
    output: {} as any,
    description: 'Mock LLM behavior from _mock object (free testing)',
    run: async (input) => {
      const result: any = {};

      if (input && typeof input === 'object') {
        Object.assign(result, input);
      }

      const mock = (input as any)._mock;

      if (mock && typeof mock === 'object') {
        for (const key in mock) {
          if (typeof mock[key] === 'object') {
            Object.assign(result, mock[key]);
          }
        }
      }

      return {
        output: result,
        usage: { tokens: 0, cost: 0, duration: 0 }
      };
     }
  }),


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
