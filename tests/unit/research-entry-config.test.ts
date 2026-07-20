import { describe, expect, it } from 'vitest';

import {
  normalizeResearchEntryConfig,
  researchExampleLinks,
} from '@/lib/research-entry-config';

describe('research entry example links', () => {
  it('maps the same configured account and note examples used by the extension', () => {
    expect(
      researchExampleLinks({
        accountAnalysis: {
          exampleUrl: 'https://mediaclaw.app/share/account/example',
        },
        noteBreakdown: {
          exampleUrl: 'https://mediaclaw.app/share/note/example',
        },
      })
    ).toEqual({
      accountAnalysisExample: 'https://mediaclaw.app/share/account/example',
      noteBreakdownExample: 'https://mediaclaw.app/share/note/example',
    });
  });

  it('does not expose invalid configured URLs', () => {
    expect(
      normalizeResearchEntryConfig({
        accountAnalysis: { exampleUrl: 'javascript:alert(1)' },
        noteBreakdown: { exampleUrl: '  ' },
      })
    ).toEqual({
      accountAnalysis: { exampleUrl: '' },
      noteBreakdown: { exampleUrl: '' },
    });
  });
});
