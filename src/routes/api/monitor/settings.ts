import { createFileRoute } from '@tanstack/react-router';

import {
  codeFromRequest,
  pluginErr,
  pluginNotMigrated,
  readJsonBody,
  resolvePluginCredentialAccess,
} from '../-plugin-compat';

async function GET({ request }: { request: Request }) {
  const result = await resolvePluginCredentialAccess({
    code: codeFromRequest(request),
  });
  if (!result.ok) return pluginErr(result.reason, result.message);
  return pluginNotMigrated('monitor settings');
}

async function PUT({ request }: { request: Request }) {
  const body = await readJsonBody(request);
  const result = await resolvePluginCredentialAccess({
    code: codeFromRequest(request, body),
  });
  if (!result.ok) return pluginErr(result.reason, result.message);
  return pluginNotMigrated('monitor settings');
}

export const Route = createFileRoute('/api/monitor/settings')({
  server: { handlers: { GET, PUT } },
});
