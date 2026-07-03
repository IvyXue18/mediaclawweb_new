import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/changelog')({
  loader: () => {
    throw redirect({
      to: '/updates',
      statusCode: 301,
    });
  },
});
