import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/zh/$')({
  loader: ({ params }) => {
    const target = `/${String(params._splat || '').replace(/^\/+/, '')}`;

    throw redirect({
      to: target === '/' ? '/' : target,
      statusCode: 301,
    });
  },
});
