#!/usr/bin/env bun

import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
await redis.connect();

async function main() {
  const results = await redis.xRange('daft:results', '-', '+', { COUNT: 20 });
  const errors = await redis.xRange('daft:errors', '-', '+', { COUNT: 20 });

  console.log('📊 Recent Results:\n');

  if (results.length === 0) {
    console.log('  No results yet');
  } else {
    for (const result of results.reverse()) {
      const { jobId, result: resultStr, completedAt, wide_event: wideEventStr } = result.message as any;
      const parsed = JSON.parse(resultStr);
      const time = new Date(parseInt(completedAt)).toLocaleString();
      const icon = parsed.success ? '✅' : '❌';

      console.log(`  ${icon} [${jobId}] ${time}`);
      console.log(`     ${parsed.message}`);

      if (parsed.usage) {
        console.log(`     Tokens: ${parsed.usage.tokens}, Cost: $${parsed.usage.cost?.toFixed(4)}, Time: ${(parsed.usage.duration/1000).toFixed(1)}s`);
      }

      if (wideEventStr) {
        try {
          const wideEvent = JSON.parse(wideEventStr);
          console.log(`     Execution ID: ${wideEvent.execution_id}`);
          console.log(`     Outcome: ${wideEvent.execution.outcome}`);
        } catch (e) {
          // Wide event parse failed, skip
        }
      }

      console.log('');
    }
  }

  console.log('\n❌ Recent Errors:\n');

  if (errors.length === 0) {
    console.log('  No errors yet');
  } else {
    for (const error of errors.reverse()) {
      const { jobId, error: errorStr, timestamp, wide_event: wideEventStr } = error.message as any;
      const time = new Date(parseInt(timestamp)).toLocaleString();

      console.log(`  ❌ [${jobId}] ${time}`);
      console.log(`     ${errorStr}`);

      if (wideEventStr) {
        try {
          const wideEvent = JSON.parse(wideEventStr);
          console.log(`     Execution ID: ${wideEvent.execution_id}`);
          if (wideEvent.error) {
            console.log(`     Error Type: ${wideEvent.error.type}`);
          }
        } catch (e) {
          // Wide event parse failed, skip
        }
      }

      console.log('');
    }
  }
}

main().catch(error => {
  console.error('Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
