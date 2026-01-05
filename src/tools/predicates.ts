import type { Predicate } from '../lib/types';

export const predicates: Record<string, Predicate> = {
  alwaysTrue: (data) => ({ ok: true }),

  analyzeDone: (data: any) => {
    const hasAnalysis = data && typeof data === 'object' && 'analysis' in data && !!data.analysis;
    return {
      ok: hasAnalysis,
      msg: hasAnalysis ? undefined : 'No analysis found in data'
    };
  },

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

  hasSummary: (data: any) => {
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

  hasOutput: (data: any) => {
    const hasOutput = data && typeof data === 'object' && 'output' in data && !!data.output;
    return {
      ok: hasOutput,
      msg: hasOutput ? undefined : 'No LLM output found in data'
    };
  },

  hasSummary: (data: any) => {
    const hasSummary = data && typeof data === 'object' && 'summary' in data && !!data.summary;
    return {
      ok: hasSummary,
      msg: hasSummary ? undefined : 'Summary not created yet'
    };
  },

  hasEntities: (data: any) => {
    const hasEntities = data && typeof data === 'object' && 'entities' in data && !!data.entities;
    return {
      ok: hasEntities,
      msg: hasEntities ? undefined : 'Entities not extracted yet'
    };
  },

  hasCategory: (data: any) => {
    const hasCategory = data && typeof data === 'object' && 'category' in data && !!data.category;
    return {
      ok: hasCategory,
      msg: hasCategory ? undefined : 'Category not assigned yet'
    };
  },

  hasKeywords: (data: any) => {
    const hasKeywords = data && typeof data === 'object' && 'keywords' in data && Array.isArray(data.keywords) && data.keywords.length > 0;
    return {
      ok: hasKeywords,
      msg: hasKeywords ? undefined : 'Keywords not extracted yet'
    };
  },

  hasTone: (data: any) => {
    const hasTone = data && typeof data === 'object' && 'tone' in data && !!data.tone;
    return {
      ok: hasTone,
      msg: hasTone ? undefined : 'Tone not determined yet'
    };
  },

  hasSummary: (data: any) => {
    const hasSummary = data && typeof data === 'object' && 'summary' in data && !!data.summary;
    return {
      ok: hasSummary,
      msg: hasSummary ? undefined : 'Summary not created yet'
    };
  },

  hasEntities: (data: any) => {
    const hasEntities = data && typeof data === 'object' && 'entities' in data && Array.isArray(data.entities) && data.entities.length > 0;
    return {
      ok: hasEntities,
      msg: hasEntities ? undefined : 'Entities not extracted yet'
    };
  },

  hasCategory: (data: any) => {
    const hasCategory = data && typeof data === 'object' && 'category' in data && !!data.category;
    return {
      ok: hasCategory,
      msg: hasCategory ? undefined : 'Category not assigned yet'
    };
  }
};
