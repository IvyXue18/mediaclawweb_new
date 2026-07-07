import { createFileRoute } from '@tanstack/react-router';
import { OPTIONS, POST } from '@/routes/api/analytics/events';

export const Route = createFileRoute('/api/events/track')({
  server: {
    handlers: { OPTIONS, POST },
  },
});
