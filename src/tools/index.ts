import type { Tool, ToolConfig } from '../lib/types';

export function defineTool<I, O>(config: ToolConfig<I, O>): Tool<I, O> {
  return config as any;
}

export const tools: Record<string, Tool> = {
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
