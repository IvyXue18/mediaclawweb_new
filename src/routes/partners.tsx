import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/partners')({
  loader: ({ location }) => {
    throw redirect({
      to: '/referral',
      search: location.search,
      statusCode: 301,
    });
  },
});
