#!/usr/bin/env bun

/**
 * DAFT Worker Cleanup Script
 *
 * Stops all running DAFT worker processes.
 * Useful during development when workers become stale or unresponsive.
 */

async function main() {
  console.log('Cleaning up DAFT worker processes...\n');

  try {
    // Try multiple patterns to find workers
    const patterns = ['bun src/cli/worker.ts', 'bun.*worker'];

    let allPids: string[] = [];

    for (const pattern of patterns) {
      const processes = Bun.spawn(['pgrep', '-f', pattern], {
        stdout: 'pipe',
        stderr: 'pipe',
      });

      const output = await new Response(processes.stdout).text();
      const pids = output.trim().split('\n').filter(Boolean);
      allPids = [...allPids, ...pids];
    }

    // Deduplicate PIDs
    const uniquePids = [...new Set(allPids)];

    if (uniquePids.length === 0) {
      console.log('✓ No DAFT workers found running');
      process.exit(0);
    }

    console.log(`Found ${uniquePids.length} worker process(es):`);
    uniquePids.forEach(pid => console.log(`  - PID ${pid}`));

    // Kill each process
    console.log('\nStopping workers...');
    for (const pid of uniquePids) {
      try {
        process.kill(Number.parseInt(pid), 'SIGTERM');
        console.log(`  ✓ Stopped PID ${pid}`);
      } catch (error) {
        console.error(`  ✗ Failed to stop PID ${pid}`);
      }
    }

    // Wait a moment for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Force kill any remaining processes
    let remainingPids: string[] = [];
    for (const pattern of patterns) {
      const processes = Bun.spawn(['pgrep', '-f', pattern], {
        stdout: 'pipe',
        stderr: 'pipe',
      });

      const output = await new Response(processes.stdout).text();
      const pids = output.trim().split('\n').filter(Boolean);
      remainingPids = [...remainingPids, ...pids];
    }

    const uniqueRemainingPids = [...new Set(remainingPids)];

    if (uniqueRemainingPids.length > 0) {
      console.log('\nForce stopping remaining processes...');
      for (const pid of uniqueRemainingPids) {
        try {
          process.kill(Number.parseInt(pid), 'SIGKILL');
          console.log(`  ✓ Force stopped PID ${pid}`);
        } catch (error) {
          console.error(`  ✗ Failed to force stop PID ${pid}`);
        }
      }
    }

    console.log('\n✓ Cleanup complete');
    console.log('\nTo start a new worker: bun run worker');
  } catch (error) {
    console.error('Error during cleanup:', error instanceof Error ? error.message : String(error));
    console.log('\nYou may need to manually kill processes:');
    console.log('  pkill -f "bun src/cli/worker.ts"');
    console.log('  pkill -f "bun worker"');
    process.exit(1);
  }
}

main();
