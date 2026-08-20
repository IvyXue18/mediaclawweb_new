import { useQuery } from '@tanstack/react-query';

import { apiGet, type PageResult } from '@/lib/api-client';

type TicketAttentionRole = 'admin' | 'user';

const ATTENTION_CONFIG: Record<
  TicketAttentionRole,
  { queryKey: readonly string[]; endpoint: string }
> = {
  admin: {
    queryKey: ['admin-tickets', 'attention'],
    endpoint: '/api/admin/tickets?status=open&page=1&pageSize=1',
  },
  user: {
    queryKey: ['user-tickets', 'attention'],
    endpoint: '/api/tickets?status=replied&page=1&pageSize=1',
  },
};

/**
 * Fetch the smallest possible ticket page and use its total as a navigation
 * attention signal. Admins are alerted to tickets awaiting a first response;
 * users are alerted when support has replied. The query refreshes when its
 * navigation surface mounts or the page reloads, without background polling.
 */
export function useTicketAttention(
  role: TicketAttentionRole,
  enabled = true,
  viewerId?: string
) {
  const config = ATTENTION_CONFIG[role];

  return useQuery({
    queryKey: [...config.queryKey, viewerId || 'anonymous'],
    queryFn: () => apiGet<PageResult<unknown>>(config.endpoint),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
