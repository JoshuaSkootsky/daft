import type { Predicate } from '../lib/types';

/**
 * Registry of built-in predicates.
 *
 * Predicates determine when a step should stop iterating.
 * Each predicate is a function that takes the current data and returns
 * an object with ok (success) and optional msg (failure reason).
 */
export const predicates: Record<string, Predicate> = {
  /**
   * Always returns true - step completes immediately.
   *
   * Useful for steps that always run exactly once.
   */
  alwaysTrue: (data) => ({ ok: true }),

  /**
   * Checks if an analysis field exists and is truthy.
   *
   * Use with steps that produce analysis data.
   *
   * @example
   * ```typescript
   * const step: Step = {
   *   name: 'analyze',
   *   until: 'analyzeDone',
   *   maxIter: 5,
   *   tools: ['llm']
   * };
   * ```
   */
  analyzeDone: (data: any) => {
    const hasAnalysis = data && typeof data === 'object' && 'analysis' in data && !!data.analysis;
    return {
      ok: hasAnalysis,
      msg: hasAnalysis ? undefined : 'No analysis found in data'
    };
  },

  /**
   * Checks if the score field exists and is >= 80.
   *
   * Use with steps that calculate scores or metrics.
   * Useful for iterative improvement workflows.
   *
   * @example
   * ```typescript
   * const step: Step = {
   *   name: 'improve',
   *   until: 'scoreCheck',
   *   maxIter: 10,
   *   tools: ['llm']
   * };
   * ```
   */
  scoreCheck: (data: any) => {
    const score = data && typeof data === 'object' ? data.score : undefined;
    if (typeof score !== 'number') {
      return { ok: false, msg: 'Score must be a number' };
    }
    if (score >= 80) {
      return { ok: true };
    }
    return {
      ok: false,
      msg: `Score ${score} < 80`
    };
  },

  /**
   * Checks if the data is truthy.
   *
   * For boolean data, checks if it's true.
   * For other types, uses JavaScript truthiness.
   *
   * @example
   * ```typescript
   * const step: Step = {
   *   name: 'validate',
   *   until: 'truthy',
   *   maxIter: 1,
   *   tools: ['llm']
   * };
   * ```
   */
  truthy: (data: any) => {
    const truthy = data && typeof data === 'boolean' ? data : !!data;
    return {
      ok: truthy,
      msg: truthy ? undefined : 'Value is falsy'
    };
  },

  hasMetadata: (data: any) => {
    const hasMetadata = data && typeof data === 'object' &&
      'language' in data && 'description' in data && 'stars' in data;
    return {
      ok: hasMetadata,
      msg: hasMetadata ? undefined : 'Repository metadata not extracted yet'
    };
  },

  /**
   * Checks if a purpose_summary field exists and is truthy.
   *
   * Use with repository summarization steps.
   */
  hasPurposeSummary: (data: any) => {
    const hasSummary = data && typeof data === 'object' &&
      'purpose_summary' in data && data.purpose_summary;
    return {
      ok: hasSummary,
      msg: hasSummary ? undefined : 'Purpose not summarized yet'
    };
  },

  hasFeatures: (data: any) => {
    const hasFeatures = data && typeof data === 'object' &&
      'features' in data && Array.isArray(data.features) && data.features.length > 0;
    return {
      ok: hasFeatures,
      msg: hasFeatures ? undefined : 'Features not extracted yet'
    };
  },

  hasAnalysis: (data: any) => {
    const hasAnalysis = data && typeof data === 'object' &&
      'codebase_analysis' in data && data.codebase_analysis;
    return {
      ok: hasAnalysis,
      msg: hasAnalysis ? undefined : 'Codebase not analyzed yet'
    };
  },

  hasSuggestions: (data: any) => {
    const hasSuggestions = data && typeof data === 'object' &&
      'improvements' in data && Array.isArray(data.improvements) && data.improvements.length > 0;
    return {
      ok: hasSuggestions,
      msg: hasSuggestions ? undefined : 'Improvements not suggested yet'
    };
  },

  /**
   * Checks if an output field exists and is truthy.
   *
   * Use with LLM tools that return output data.
   *
   * @example
   * ```typescript
   * const step: Step = {
   *   name: 'generate',
   *   until: 'hasOutput',
   *   maxIter: 3,
   *   tools: ['llm']
   * };
   * ```
   */
  /**
   * Checks if an output field exists and is truthy.
   *
   * Use with LLM tools that return output data.
   *
   * @example
   * ```typescript
   * const step: Step = {
   *   name: 'generate',
   *   until: 'hasOutput',
   *   maxIter: 3,
   *   tools: ['llm']
   * };
   * ```
   */
  hasOutput: (data: any) => {
    const hasOutput = data && typeof data === 'object' && 'output' in data && !!data.output;
    return {
      ok: hasOutput,
      msg: hasOutput ? undefined : 'No LLM output found in data'
    };
  },

  /**
   * Checks if a summary field exists and is truthy.
   *
   * Use with summarization or text generation steps.
   */
  hasSummary: (data: any) => {
    const hasSummary = data && typeof data === 'object' && 'summary' in data && !!data.summary;
    return {
      ok: hasSummary,
      msg: hasSummary ? undefined : 'Summary not created yet'
    };
  },

  /**
   * Checks if an entities field exists and is truthy.
   *
   * Use with entity extraction steps.
   */
  hasEntities: (data: any) => {
    const hasEntities = data && typeof data === 'object' && 'entities' in data && !!data.entities;
    return {
      ok: hasEntities,
      msg: hasEntities ? undefined : 'Entities not extracted yet'
    };
  },

  /**
   * Checks if a category field exists and is truthy.
   *
   * Use with classification or categorization steps.
   */
  hasCategory: (data: any) => {
    const hasCategory = data && typeof data === 'object' && 'category' in data && !!data.category;
    return {
      ok: hasCategory,
      msg: hasCategory ? undefined : 'Category not assigned yet'
    };
  },

  /**
   * Checks if a keywords field exists and is a non-empty array.
   *
   * Use with keyword extraction steps.
   */
  hasKeywords: (data: any) => {
    const hasKeywords = data && typeof data === 'object' && 'keywords' in data && Array.isArray(data.keywords) && data.keywords.length > 0;
    return {
      ok: hasKeywords,
      msg: hasKeywords ? undefined : 'Keywords not extracted yet'
    };
  },

  /**
   * Checks if a tone field exists and is truthy.
   *
   * Use with tone analysis steps.
   */
  hasTone: (data: any) => {
    const hasTone = data && typeof data === 'object' && 'tone' in data && !!data.tone;
    return {
      ok: hasTone,
      msg: hasTone ? undefined : 'Tone not determined yet'
    };
  },

  hasDeepSummary: (data: any) => {
    const hasDeepSummary = data && typeof data === 'object' && 'deep_summary' in data && !!data.deep_summary;
    return {
      ok: hasDeepSummary,
      msg: hasDeepSummary ? undefined : 'Deep summary not created yet'
    };
  },

  hasRisks: (data: any) => {
    const hasRisks = data && typeof data === 'object' && 'risks' in data && Array.isArray(data.risks) && data.risks.length > 0;
    return {
      ok: hasRisks,
      msg: hasRisks ? undefined : 'Risks not extracted yet'
    };
  },

  hasReport: (data: any) => {
    const hasReport = data && typeof data === 'object' && 'report' in data && !!data.report;
    return {
      ok: hasReport,
      msg: hasReport ? undefined : 'Report not generated yet'
    };
  },

  hasStyleIssues: (data: any) => {
    const hasStyleIssues = data && typeof data === 'object' && 'style_issues' in data && Array.isArray(data.style_issues) && data.style_issues.length > 0;
    return {
      ok: hasStyleIssues,
      msg: hasStyleIssues ? undefined : 'Style issues not found yet'
    };
  },

  hasSecurityIssues: (data: any) => {
    const hasSecurityIssues = data && typeof data === 'object' && 'security_issues' in data && Array.isArray(data.security_issues) && data.security_issues.length > 0;
    return {
      ok: hasSecurityIssues,
      msg: hasSecurityIssues ? undefined : 'Security issues not found yet'
    };
  },

  hasPerformanceIssues: (data: any) => {
    const hasPerformanceIssues = data && typeof data === 'object' && 'performance_issues' in data && Array.isArray(data.performance_issues) && data.performance_issues.length > 0;
    return {
      ok: hasPerformanceIssues,
      msg: hasPerformanceIssues ? undefined : 'Performance issues not found yet'
    };
  },

  hasRecommendations: (data: any) => {
    const hasRecommendations = data && typeof data === 'object' && 'recommendations' in data && Array.isArray(data.recommendations) && data.recommendations.length > 0;
    return {
      ok: hasRecommendations,
      msg: hasRecommendations ? undefined : 'Recommendations not generated yet'
    };
  }
};
