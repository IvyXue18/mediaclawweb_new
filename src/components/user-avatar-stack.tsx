import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type UserSocialProof = { total: number; avatars: string[] };

function formatUserCount(total: number) {
  if (total < 100) return String(total);
  return `${Math.floor(total / 100) * 100}+`;
}

/**
 * Social-proof row: recent users' profile photos plus a count label.
 * `tip` must contain `{count}`, e.g. "{count} 人在使用".
 * Renders nothing when the stats request fails or there are no users.
 */
export function UserAvatarStack({
  tip,
  align = 'center',
  className,
}: {
  tip: string;
  align?: 'center' | 'start';
  className?: string;
}) {
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const { data, isError } = useQuery({
    queryKey: ['user-social-proof'],
    queryFn: () => apiGet<UserSocialProof>('/api/stats/users'),
    staleTime: 10 * 60 * 1000,
  });

  if (isError || (data && data.total <= 0)) return null;

  const avatars = (data?.avatars || []).filter((src) => !failed.has(src));
  const justify = align === 'start' ? 'justify-start' : 'justify-center';

  return (
    <div className={cn('flex min-h-10 items-center', justify, className)}>
      {data ? (
        <div
          className={cn(
            'animate-in fade-in flex flex-wrap items-center gap-3 duration-500',
            justify
          )}
        >
          {avatars.length ? (
            <div className="flex -space-x-2.5" aria-hidden="true">
              {avatars.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  width={36}
                  height={36}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => setFailed((prev) => new Set(prev).add(src))}
                  className="ring-background bg-muted size-9 rounded-full object-cover ring-2"
                />
              ))}
            </div>
          ) : null}
          <span className="text-muted-foreground text-sm font-medium">
            {tip.replace('{count}', formatUserCount(data.total))}
          </span>
        </div>
      ) : null}
    </div>
  );
}
