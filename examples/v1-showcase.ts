/**
 * DAFT v1.0.0 showcase
 *
 * A 45-second, 25-cent, multi-step enrichment pipeline
 * that turns a raw earnings call transcript into
 * structured, investment-grade insights.
 */
import { predicates } from '../src/tools/predicates';
import { tools } from '../src/tools';

export default {
	/* ---------- 1. Starting data ---------- */
	initial: (() => {
		const base = {
			ticker: 'NVDA',
			transcript: `NVIDIA reported Q4 revenue of $22.1B, up 265% YoY. Data-center sales were $18.4B. Gross margin expanded to 76.7%.`
		};
		const hasApiKey = !!process.env.ZEN_API_KEY;
		if (!hasApiKey) {
			base._mock = {
				cheap_summary: { summary: 'Record Q4: $22.1B rev, +265% YoY, DC $18.4B, GM 76.7%.' },
				keywords: { keywords: ['AI boom', 'data-center', 'gross margin', 'record'] },
				deep_summary: { deep_summary: 'NVIDIA crushed estimates on Gen-AI demand; GM expansion shows pricing power.' },
				risk_factors: { risks: ['Supply chain', 'China export rules', 'Valuation'] },
				report: { report: 'Buy-rated: strong moat, but monitor regulation & supply.' }
			};
		}
		return base;
	})(),
	
	/* ---------- 2. Global budget ---------- */
	budget: {
	    maxTime: 45_000,   
	    maxTokens: 4000,
	    maxCost: 0.25    
	},
	
	/* ---------- 3. DAG workflow ---------- */
		steps: (() => {
		const hasApiKey = !!process.env.ZEN_API_KEY;
		return [
			{
				name: 'cheap_summary',
				until: 'hasSummary',
				maxIter: 2,
				tools: hasApiKey ? ['llm'] : ['mockLLM']
			},
			{
				name: 'deep_summary',
				dependsOn: ['cheap_summary'],
				until: 'hasDeepSummary',
				maxIter: 2,
				tools: hasApiKey ? ['llm'] : ['mockLLM']
			},
			{
				name: 'keywords',
				dependsOn: ['cheap_summary'],
				until: 'hasKeywords',
				maxIter: 2,
				tools: hasApiKey ? ['llm'] : ['mockLLM']
			},
			{
				name: 'risk_factors',
				dependsOn: ['deep_summary'],
				until: 'hasRisks',
				maxIter: 2,
				tools: hasApiKey ? ['llm'] : ['mockLLM']
			},
			{
				name: 'report',
				dependsOn: ['keywords', 'risk_factors'],
				until: 'hasReport',
				maxIter: 1,
				tools: hasApiKey ? ['llm'] : ['mockLLM']
			}
		];
	})()
};
