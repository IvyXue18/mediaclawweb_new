import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/zh/')({
  loader: () => {
    throw redirect({
      to: '/',
      statusCode: 301,
    });
  },
});
