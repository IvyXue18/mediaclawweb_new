import { count, desc, isNotNull } from 'drizzle-orm';

import { db } from '@/core/db';
import { user } from '@/config/db/schema';

export type UserSocialProof = {
  total: number;
  avatars: string[];
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const AVATAR_LIMIT = 10;
const AVATAR_CANDIDATES = 50;

let cached: { value: UserSocialProof; expiresAt: number } | null = null;

// Only real profile photos served over https (e.g. Google OAuth
// lh3.googleusercontent.com). Skips data: URIs and relative uploads.
function isPublicAvatarUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Public, anonymized sign-up summary for the homepage: total users plus the
 * most recent profile photos. Never returns names, emails or ids.
 */
export async function getUserSocialProof(): Promise<UserSocialProof> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.value;

  const [[totalRow], rows] = await Promise.all([
    db().select({ count: count() }).from(user),
    db()
      .select({ image: user.image })
      .from(user)
      .where(isNotNull(user.image))
      .orderBy(desc(user.createdAt))
      .limit(AVATAR_CANDIDATES),
  ]);

  const avatars = [
    ...new Set(
      (rows as Array<{ image: string | null }>)
        .map((row) => row.image)
        .filter(isPublicAvatarUrl)
    ),
  ].slice(0, AVATAR_LIMIT);

  const value = { total: Number(totalRow?.count ?? 0), avatars };
  cached = { value, expiresAt: now + CACHE_TTL_MS };
  return value;
}
