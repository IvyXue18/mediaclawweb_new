import { createFileRoute } from '@tanstack/react-router';

import { userInfoResponse } from './-compat';

async function GET({ request }: { request: Request }) {
  return userInfoResponse(request);
}

export const Route = createFileRoute('/api/user/get-user-info')({
  server: {
    handlers: { GET },
  },
});
