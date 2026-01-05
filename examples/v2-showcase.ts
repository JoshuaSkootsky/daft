/**
 * DAFT v2 showcase - Multi-pass code review pipeline
 *
 * Demonstrates how DAFT transforms raw code into production-grade
 * structured review through multiple passes with strict budget control.
 *
 * What this proves vs Ralph Wiggum:
 * - DAFT: Explicit, bounded, predictable, parallel, budgeted
 * - Ralph: Unbounded, lucky-based, hope-it-works, expensive
 *
 * Pipeline: style_pass → security_pass → performance_pass → synthesis_pass
 * Each pass adds context, later passes depend on earlier results.
 */
import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
	/* ---------- 1. Starting data ---------- */
	initial: {
		repository: 'skootsky/daft',
		stepName: 'style_pass',
		
		/* ====== _mock behavior for each pass ====== */
		_mock: {
			style_pass: {
				// Mock output from style checker
				style_issues: [
					{ file: 'src/tools/index.ts', line: 145, issue: 'Missing semicolon', severity: 'low' },
					{ file: 'src/tools/predicates.ts', line: 89, issue: 'Inconsistent naming', severity: 'medium' }
				],
				lint_score: 85
			},
			security_pass: {
				security_issues: [
					{ file: 'src/cli/worker.ts', line: 25, issue: 'SQL injection risk', severity: 'critical' },
					{ file: 'src/tools/index.ts', line: 62, issue: 'Hardcoded API endpoint', severity: 'high' }
				],
				vulnerability_count: 2,
				high_risk_count: 0
			},
			performance_pass: {
				performance_issues: [
					{ file: 'src/lib/runtime.ts', line: 265, issue: 'O(n²) algorithm', severity: 'medium' },
					{ file: 'src/lib/runtime.ts', line: 318, issue: 'Memory leak potential', severity: 'low' }
				],
				complexity_score: 7,
				test_coverage: 65
			},
			synthesis_pass: {
				recommendations: [
					{ priority: 1, action: 'Add input validation', reason: 'Prevent runtime errors' },
					{ priority: 2, action: 'Refactor O(n²) to O(n)', reason: 'Performance optimization' },
					{ priority: 3, action: 'Add unit tests', reason: 'Increase coverage from 65% to 80%' }
				],
				overall_rating: 'strong_buy',
				approval_status: 'pending'
			}
		}
	},

	/* ---------- 2. Global budget ---------- */
	budget: {
		maxTime: 60_000,      
		maxTokens: 12_000,
		maxCost: 1.00      
	},

	/* ---------- 3. DAG workflow ---------- */
	steps: [
		/* ---- 3a. Parallel analysis passes ---- */
		{
			name: 'style_pass',
			until: 'truthy',
			maxIter: 1,
			tools: ['mockLLM']
		},
		{
			name: 'security_pass',
			until: 'truthy',
			maxIter: 1,
			tools: ['mockLLM']
		},
		{
			name: 'performance_pass',
			until: 'truthy',
			maxIter: 1,
			tools: ['mockLLM']
		},

		/* ---- 3b. Synthesis (depends on all 3 passes) ---- */
		{
			name: 'synthesis_pass',
			dependsOn: ['style_pass', 'security_pass', 'performance_pass'],
			until: 'truthy',
			maxIter: 2,
			tools: ['mockLLM']
		}
	]
};
