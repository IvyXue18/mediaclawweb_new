import { createFileRoute } from '@tanstack/react-router';

import {
  normalizeResearchEntryConfig,
  type ResearchEntryConfig,
} from '@/lib/research-entry-config';
import { respData, respErr } from '@/lib/resp';

const RESEARCH_ENTRY_CONFIG_URL = `${
  import.meta.env.DEV ? 'http://127.0.0.1:3005' : 'https://api.mediaclaw.app'
}/api/research-entry-config`;

async function GET() {
  try {
    const response = await fetch(RESEARCH_ENTRY_CONFIG_URL, {
      headers: { Accept: 'application/json' },
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      message?: string;
      data?: ResearchEntryConfig;
    };

    if (!response.ok || !payload.ok) {
      return respErr(payload.message || 'get research entry config failed');
    }

    return respData(normalizeResearchEntryConfig(payload.data));
  } catch (error: any) {
    return respErr(error?.message || 'get research entry config failed');
  }
}

export const Route = createFileRoute('/api/research-entry-config')({
  server: { handlers: { GET } },
});
