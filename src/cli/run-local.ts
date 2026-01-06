#!/usr/bin/env bun

import { DAGExecutor } from '../lib/runtime';
import { predicates } from '../tools/predicates';
import { tools } from '../tools';
import type { Spec } from '../lib/types';
import { createWideEventLogger, generateExecutionId } from '../lib/logging';

async function main() {
  const specPath = process.argv[2];
  const dataPath = process.argv[3];

  if (!specPath) {
    console.error('Usage: bun run run-local <spec.ts> [data.json]');
    process.exit(1);
  }

  const executionId = generateExecutionId();
  const logger = createWideEventLogger(executionId);

  console.log(`Loading spec: ${specPath}`);

  try {
    const absoluteSpecPath = import.meta.dir + '/../../' + specPath;
    const spec = (await import(absoluteSpecPath)).default as Spec;

    logger.setSpec({
      file: specPath,
      steps_count: spec.steps.length,
      predicates: [...new Set(spec.steps.map(s => s.until))],
      tools: [...new Set(spec.steps.flatMap(s => s.tools))],
      budget: spec.budget,
    });
    logger.setExecutionMode('local');

    let data = spec.initial;
    if (dataPath) {
      const file = Bun.file(dataPath);
      if (!await file.exists()) {
        console.error(`Error: Data file not found: ${dataPath}`);
        process.exit(1);
      }
      try {
        const loadedData = JSON.parse(await file.text());
        const initial = spec.initial as Record<string, any>;
        data = { ...initial, ...loadedData, _mock: initial._mock };
        console.log(`Loaded data from: ${dataPath}`);
      } catch (error) {
        console.error(`JSON error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    }

    console.log('Executing...\n');

    const executor = new DAGExecutor(predicates, tools, 4, logger);
    const result = await executor.execute({
      ...spec,
      initial: data
    });

    console.log(`\n${result.message}`);
    console.log(`Result: ${JSON.stringify(result.data)}\n`);

    if (result.usage) {
      console.log(`Usage:`);
      console.log(`  Tokens: ${result.usage.tokens}`);
      console.log(`  Cost: $${result.usage.cost.toFixed(4)}`);
      console.log(`  Duration: ${(result.usage.duration / 1000).toFixed(1)}s`);
    }

    if (!result.success) {
      logger.setError({
        type: 'ExecutionError',
        message: result.message,
        retriable: true,
      });
    }

    logger.emit();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\nError: ${errorMessage}`);

    logger.setError({
      type: error instanceof Error ? error.name : 'UnknownError',
      message: errorMessage,
      retriable: error instanceof Error && error.message.includes('timeout'),
    });

    logger.emit();
    process.exit(1);
  }
}

main();
