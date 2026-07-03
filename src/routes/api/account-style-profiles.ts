import { createFileRoute } from '@tanstack/react-router';

import {
  codeFromRequest,
  pluginErr,
  pluginOk,
  resolvePluginCredentialAccess,
} from './-plugin-compat';

async function GET({ request }: { request: Request }) {
  const result = await resolvePluginCredentialAccess({
    code: codeFromRequest(request),
  });
  if (!result.ok) return pluginErr(result.reason, result.message);
  return pluginOk({ profiles: [] }, 'account style profiles loaded');
}

export const Route = createFileRoute('/api/account-style-profiles')({
  server: { handlers: { GET } },
});
