export type ResearchEntry = {
  description?: string;
  costCredits?: number;
  reanalysisCostCredits?: number;
  exampleUrl?: string;
};

export type ResearchEntryConfig = {
  noteBreakdown?: ResearchEntry;
  accountAnalysis?: ResearchEntry;
};

function publicUrl(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return /^https?:\/\//i.test(normalized) ? normalized : '';
}

export function normalizeResearchEntryConfig(
  config?: ResearchEntryConfig | null
): ResearchEntryConfig {
  return {
    noteBreakdown: {
      exampleUrl: publicUrl(config?.noteBreakdown?.exampleUrl),
    },
    accountAnalysis: {
      exampleUrl: publicUrl(config?.accountAnalysis?.exampleUrl),
    },
  };
}

export function researchExampleLinks(config?: ResearchEntryConfig | null) {
  const normalized = normalizeResearchEntryConfig(config);
  return {
    accountAnalysisExample: normalized.accountAnalysis?.exampleUrl || '',
    noteBreakdownExample: normalized.noteBreakdown?.exampleUrl || '',
  };
}
