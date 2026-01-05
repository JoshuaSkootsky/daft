#!/usr/bin/env bun

import { serializeSpec } from '../lib/serializer';
import { predicates } from '../tools/predicates';
import { tools } from '../tools';
import type { Spec } from '../lib/types';
import { createClient } from 'redis';
import { createWideEventLogger, generateExecutionId } from '../lib/logging';

const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
await redis.connect();

async function main() {
  const specPath = process.argv[2];

  if (!specPath) {
    console.error('Usage: bun run submit <spec.ts>');
    process.exit(1);
  }

  const executionId = generateExecutionId();
  const logger = createWideEventLogger(executionId);

  console.log(`Loading spec: ${specPath}`);

  try {
    const spec = (await import(specPath)).default as Spec;

    const availablePredicates = new Set(Object.keys(predicates));
    const availableTools = new Set(Object.keys(tools));

    const serialized = serializeSpec(spec, availablePredicates, availableTools);

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await redis.xAdd('daft:jobs', '*', {
      jobId,
      spec: serialized,
      submittedAt: Date.now().toString()
    });

    logger.setSpec({
      file: specPath,
      steps_count: spec.steps.length,
      predicates: [...new Set(spec.steps.map(s => s.until))],
      tools: [...new Set(spec.steps.flatMap(s => s.tools))],
    });
    logger.setExecutionMode('distributed');

    console.log(`✓ Spec submitted: ${jobId}`);
    console.log(`  Steps: ${spec.steps.length}`);
    console.log(`  Predicates: ${[...new Set(spec.steps.map(s => s.until))].join(', ')}`);
    console.log(`  Tools: ${[...new Set(spec.steps.flatMap(s => s.tools))].join(', ')}`);
    console.log(`\nMonitor: bun run logs`);

    logger.emit();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);

    logger.setError({
      type: error instanceof Error ? error.name : 'UnknownError',
      message: errorMessage,
      retriable: false,
    });

    logger.emit();
    process.exit(1);
  }
}

main();
