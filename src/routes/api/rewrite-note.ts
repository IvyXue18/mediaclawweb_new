import { createFileRoute } from '@tanstack/react-router';

import {
  codeFromRequest,
  pluginErr,
  pluginNotMigrated,
  readJsonBody,
  resolvePluginCredentialAccess,
} from './-plugin-compat';

async function POST({ request }: { request: Request }) {
  const body = await readJsonBody(request);
  const result = await resolvePluginCredentialAccess({
    code: codeFromRequest(request, body),
  });
  if (!result.ok) return pluginErr(result.reason, result.message);
  return pluginNotMigrated('note rewrite');
}

export const Route = createFileRoute('/api/rewrite-note')({
  server: { handlers: { POST } },
});
