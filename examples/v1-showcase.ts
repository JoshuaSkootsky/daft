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
	initial: {
	    ticker: 'NVDA',
	    transcript: `NVIDIA reported Q4 revenue of $22.1B, up 265% YoY. Data-center sales were $18.4B. Gross margin expanded to 76.7%.`,
	    
	    /* ====== mockLLM behaviour defined inline ====== */
	    _mock: {
	      cheap_summary: { summary: 'Record Q4: $22.1B rev, +265% YoY, DC $18.4B, GM 76.7%.' },
	      keywords: { keywords: ['AI boom', 'data-center', 'gross margin', 'record'] },
	      deep_summary: { deep_summary: 'NVIDIA crushed estimates on Gen-AI demand; GM expansion shows pricing power.' },
	      risk_factors: { risks: ['Supply chain', 'China export rules', 'Valuation'] },
	      report: { report: 'Buy-rated: strong moat, but monitor regulation & supply.' }
	    }
	},
	
	/* ---------- 2. Global budget ---------- */
	budget: {
	    maxTime: 45_000,   
	    maxTokens: 4000,
	    maxCost: 0.25    
	},
	
	/* ---------- 3. DAG workflow ---------- */
	steps: [
	    /* ---- 3a. Free 1-cent summary ---- */
	    {
	      name: 'cheap_summary',
	      until: 'truthy',
	      maxIter: 2,
	      tools: ['mockLLM']       
	    },
	
	    /* ---- 3b. Parallel deep dive & keywords ---- */
	    {
	      name: 'deep_summary',
	      dependsOn: ['cheap_summary'],
	      until: 'truthy',
	      maxIter: 2,
	      tools: ['llm']       
	    },
	    {
	      name: 'keywords',
	      dependsOn: ['cheap_summary'],
	      until: 'truthy',
	      maxIter: 2,
	      tools: ['mockLLM']       
	    },
	
	    /* ---- 3c. Risk analysis (runs after deep_summary) ---- */
	    {
	      name: 'risk_factors',
	      dependsOn: ['deep_summary'],
	      until: 'truthy',
	      maxIter: 2,
	      tools: ['mockLLM']       
	    },
	
	    /* ---- 3d. Final merge ---- */
	    {
	      name: 'report',
	      dependsOn: ['keywords', 'risk_factors'],
	      until: 'truthy',
	      maxIter: 1,
	      tools: ['llm']
	    }
	  ]
};
