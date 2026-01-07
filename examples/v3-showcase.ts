/**
 * DAFT v3 showcase - Multi-Pass Content Generation Pipeline
 *
 * THIS showcases DAFT's core strengths:
 * - Multi-stage transformation with clear data flow
 * - Parallel extraction of keywords and entities
 * - Quality assessment driving improvement
 * - Budget enforcement across all stages
 *
 * Pipeline:
 *   Layer 1: draft (initial content)
 *   Layer 2: extract_keywords, extract_entities (PARALLEL)
 *   Layer 3: improve_content (uses extracted data)
 *   Layer 4: quality_assess (validates output)
 *
 * Note: True iterative improvement (retry until quality >= X)
 * only demonstrates its power with real LLMs. With mockLLM,
 * all data is pre-defined, so predicates pass immediately.
 *
 * The "until" clause is where DAFT's magic lives - with real LLMs,
 * the improve_content step would re-run with feedback until quality meets threshold.
 */
import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
	/* ---------- 1. Starting data ---------- */
	initial: (() => {
		const base: any = {
			topic: 'Explain the difference between git merge and git rebase',
			target_audience: 'Intermediate developers',
			quality_threshold: 85,
			format_requirements: 'Markdown with tables'
		};
		const hasApiKey = !!process.env.ZEN_API_KEY;
		if (!hasApiKey) {
			base._mock = {
				draft: {
					content: `Git merge and git rebase are two ways to combine branch changes in Git.

## Git Merge
Creates a merge commit that joins two branch histories. Preserves complete timeline.

## Git Rebase
Moves commits to the tip of the target branch. Creates linear history.

## Key Differences
| Aspect | Merge | Rebase |
|--------|-------|--------|
| History | Preserved | Rewritten |
| Timeline | Original | Linear |`,
					word_count: 45
				},
				extract_keywords: {
					keywords: ['git', 'merge', 'rebase', 'branches', 'history', 'commits'],
					relevance_score: 0.92
				},
				extract_entities: {
					entities: [
						{ name: 'Git', type: 'tool' },
						{ name: 'merge commit', type: 'concept' },
						{ name: 'branch history', type: 'concept' }
					],
					entity_count: 3
				},
				improve_content: {
					content: `Git merge and git rebase are two fundamental ways to combine changes from different branches in Git.

## Git Merge
\`\`\`bash
git merge feature-branch
\`\`\`
Creates a merge commit that joins two branch histories. Preserves complete, accurate timeline.

**Best for:**
- Shared branches with collaborators
- Code reviews where history matters
- Audit trails and traceability

## Git Rebase
\`\`\`bash
git rebase main
\`\`\`
Moves your commits to the tip of the target branch, creating a linear history.

**Best for:**
- Personal feature branches
- Cleaning up commits before merging
- Creating readable commit narratives

## Key Differences
| Aspect | Merge | Rebase |
|--------|-------|--------|
| History | Preserved (accurate) | Rewritten (linear) |
| Timeline | Original commits | Commits moved |
| Use Case | Collaboration | Clean history |

## Golden Rules
1. **Never rebase** branches others are using
2. **Always pull** before rebasing to avoid conflicts
3. **Use merge** for shared/deployment branches

Understanding these tools helps you maintain clean, collaborative repositories.`,
					word_count: 120,
					improvements: ['Added bash examples', 'Best practices sections', 'Golden rules', 'Better explanations']
				},
				quality_assess: {
					overall_quality: 90,
					clarity_score: 92,
					completeness_score: 88,
					accuracy_score: 95,
					passes_threshold: true
				}
			};
		}
		return base;
	})(),

	/* ---------- 2. Global budget ---------- */
	budget: {
		maxTime: 90_000,
		maxTokens: 12_000,
		maxCost: 1.00
	},

	/* ---------- 3. DAG workflow ---------- */
	steps: (() => {
		const hasApiKey = !!process.env.ZEN_API_KEY;
		return [
			{
				name: 'draft',
				until: 'hasContent',
				maxIter: 1,
				tools: hasApiKey ? ['llm'] : ['mockLLM']
			},
			{
				name: 'extract_keywords',
				dependsOn: ['draft'],
				until: 'hasKeywords',
				maxIter: 1,
				tools: hasApiKey ? ['llm'] : ['mockLLM']
			},
			{
				name: 'extract_entities',
				dependsOn: ['draft'],
				until: 'hasEntities',
				maxIter: 1,
				tools: hasApiKey ? ['llm'] : ['mockLLM']
			},
			{
				name: 'improve_content',
				dependsOn: ['extract_keywords', 'extract_entities'],
				until: 'hasContent',
				maxIter: 3,
				tools: hasApiKey ? ['llm'] : ['mockLLM']
			},
			{
				name: 'quality_assess',
				dependsOn: ['improve_content'],
				until: 'hasQualityScore',
				maxIter: 1,
				tools: hasApiKey ? ['llm'] : ['mockLLM']
			}
		];
	})()
};
