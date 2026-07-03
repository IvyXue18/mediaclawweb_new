import { createFileRoute } from '@tanstack/react-router';

import { userCredentialsResponse } from './-compat';

async function GET({ request }: { request: Request }) {
  return userCredentialsResponse(request);
}

export const Route = createFileRoute('/api/user/get-credentials')({
  server: {
    handlers: { GET },
  },
});
