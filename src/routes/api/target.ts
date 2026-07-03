import { createFileRoute } from '@tanstack/react-router';

import {
  codeFromRequest,
  pluginErr,
  pluginNotMigrated,
  pluginOk,
  readJsonBody,
  resolvePluginCredentialAccess,
} from './-plugin-compat';

async function ensureCredential(
  request: Request,
  body?: Record<string, unknown>
) {
  const code = codeFromRequest(request, body);
  const result = await resolvePluginCredentialAccess({ code });
  if (!result.ok) return pluginErr(result.reason, result.message);
  return null;
}

async function GET({ request }: { request: Request }) {
  const error = await ensureCredential(request);
  if (error) return error;
  return pluginOk(
    {
      target: null,
      configured: false,
    },
    'target config loaded'
  );
}

async function PUT({ request }: { request: Request }) {
  const body = await readJsonBody(request);
  const error = await ensureCredential(request, body);
  if (error) return error;
  return pluginNotMigrated('target config persistence');
}

export const Route = createFileRoute('/api/target')({
  server: { handlers: { GET, PUT } },
});
