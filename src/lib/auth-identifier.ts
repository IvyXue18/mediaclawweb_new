const PHONE_AUTH_EMAIL_DOMAIN = 'phone-auth.mediaclaw.local';
const PHONE_AUTH_EMAIL_DOMAIN_PATTERN = PHONE_AUTH_EMAIL_DOMAIN.replace(
  /[.*+?^${}()|[\]\\]/g,
  '\\$&'
);

export function getPhoneAuthEmail(phone: string) {
  return `${phone}@${PHONE_AUTH_EMAIL_DOMAIN}`;
}

export function normalizePhoneIdentifier(value: string) {
  const compact = value.trim().replace(/[\s()-]/g, '');
  if (/^1\d{10}$/.test(compact)) return compact;
  if (/^\+?861\d{10}$/.test(compact)) {
    return compact.replace(/^\+?86/, '');
  }
  return null;
}

export function resolveLoginIdentifier(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) return trimmed.toLowerCase();
  const phone = normalizePhoneIdentifier(trimmed);
  return phone ? getPhoneAuthEmail(phone) : trimmed;
}

export function getPhoneFromAuthEmail(email?: string | null) {
  const match = String(email || '').match(
    new RegExp(`^(\\d+)@${PHONE_AUTH_EMAIL_DOMAIN_PATTERN}$`, 'i')
  );
  return match?.[1] || null;
}

export function formatLoginIdentifier(email?: string | null) {
  return getPhoneFromAuthEmail(email) || email || '';
}
