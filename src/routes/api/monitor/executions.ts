import { createFileRoute } from '@tanstack/react-router';

import {
  codeFromRequest,
  pluginErr,
  pluginNotMigrated,
  resolvePluginCredentialAccess,
} from '../-plugin-compat';

async function GET({ request }: { request: Request }) {
  const result = await resolvePluginCredentialAccess({
    code: codeFromRequest(request),
  });
  if (!result.ok) return pluginErr(result.reason, result.message);
  return pluginNotMigrated('monitor executions');
}

export const Route = createFileRoute('/api/monitor/executions')({
  server: { handlers: { GET } },
});
