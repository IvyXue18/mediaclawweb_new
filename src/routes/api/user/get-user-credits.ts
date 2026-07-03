import { createFileRoute } from '@tanstack/react-router';

import { userCreditsResponse } from './-compat';

async function GET({ request }: { request: Request }) {
  return userCreditsResponse(request);
}

export const Route = createFileRoute('/api/user/get-user-credits')({
  server: {
    handlers: { GET },
  },
});
