import { createFileRoute } from '@tanstack/react-router';

import {
  isValidUuid,
  pluginErr,
  pluginOk,
  readJsonBody,
  resolvePluginCredentialAccess,
} from './-plugin-compat';

async function POST({ request }: { request: Request }) {
  try {
    const body = await readJsonBody(request);
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const clientUuid =
      typeof body.clientUuid === 'string' ? body.clientUuid.trim() : '';
    const clientLabel =
      typeof body.clientLabel === 'string' ? body.clientLabel.trim() : '';
    const appVersion =
      typeof body.appVersion === 'string' ? body.appVersion.trim() : '';

    if (!code || !clientUuid || !clientLabel || !appVersion) {
      return pluginErr('invalid_request', 'missing verify fields');
    }
    if (!isValidUuid(clientUuid)) {
      return pluginErr('invalid_request', 'invalid clientUuid');
    }

    const result = await resolvePluginCredentialAccess({
      code,
      clientUuid,
      clientLabel,
      appVersion,
    });

    if (!result.ok) {
      return pluginErr(result.reason, result.message, result.data ?? null);
    }

    return pluginOk(result.data, 'verified');
  } catch (error: any) {
    return pluginErr(
      'server_error',
      `verify failed: ${error?.message || 'unknown error'}`
    );
  }
}

export const Route = createFileRoute('/api/verify')({
  server: { handlers: { POST } },
});
