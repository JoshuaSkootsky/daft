#!/usr/bin/env bun

import { DAGExecutor } from '../lib/runtime';
import { predicates } from '../tools/predicates';
import { tools } from '../tools';
import type { Spec } from '../lib/types';
import { createClient } from 'redis';
import { createWideEventLogger, generateExecutionId, generateTraceId } from '../lib/logging';

const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
await redis.connect();
const executor = new DAGExecutor(predicates, tools, 4);

async function main() {
  console.log('DAFT Worker Started');
  console.log(`  Redis: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
  console.log(`  Concurrency: 4`);
  console.log(`  Predicates: ${Object.keys(predicates).length}`);
  console.log(`  Tools: ${Object.keys(tools).length}\n`);

  while (true) {
    try {
      const streams = await redis.xRead([{ key: 'daft:jobs', id: '$' }], { COUNT: 1, BLOCK: 5000 });

      if (!streams || streams.length === 0) {
        continue;
      }

      for (const stream of streams) {
        for (const message of stream.messages) {
          const id = message.id;
          const fields = message.message as any;
          const { jobId, spec, submittedAt } = fields;

          const executionId = generateExecutionId();
          const traceId = generateTraceId();
          const logger = createWideEventLogger(executionId, traceId);

          console.log(`[${jobId}] Processing...`);

          try {
            const parsedSpec = JSON.parse(spec) as Spec;

            logger.setSpec({
              file: jobId,
              steps_count: parsedSpec.steps.length,
              predicates: [...new Set(parsedSpec.steps.map(s => s.until))],
              tools: [...new Set(parsedSpec.steps.flatMap(s => s.tools))],
              budget: parsedSpec.budget,
            });
            logger.setExecutionMode('distributed');

            const executor = new DAGExecutor(predicates, tools, 4, logger);
            const result = await executor.execute(parsedSpec);

            const wideEvent = logger.emit();

            await redis.xAdd('daft:results', '*', {
              jobId,
              result: JSON.stringify(result),
              wide_event: JSON.stringify(wideEvent),
              completedAt: Date.now().toString()
            });

            await redis.xDel('daft:jobs', [id]);

            console.log(`[${jobId}] ✓ ${result.message}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            logger.setError({
              type: error instanceof Error ? error.name : 'UnknownError',
              message: errorMessage,
              retriable: errorMessage.includes('timeout') || errorMessage.includes('network'),
            });

            const wideEvent = logger.emit();

            await redis.xAdd('daft:errors', '*', {
              jobId,
              error: errorMessage,
              wide_event: JSON.stringify(wideEvent),
              timestamp: Date.now().toString()
            });

            await redis.xDel('daft:jobs', [id]);

            console.error(`[${jobId}] ✗ Error: ${errorMessage}`);
          }
        }
      }
    } catch (error) {
      console.error('Worker error:', error instanceof Error ? error.message : String(error));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

main();
