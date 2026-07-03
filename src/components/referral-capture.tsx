import { useEffect } from 'react';

import { setCookie } from '@/lib/cookie';

const REFERRAL_COOKIE_DAYS = 30;

function normalizeReferralCode(value?: string | null) {
  const raw = String(value || '');
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {}
  return decoded
    .trim()
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 64);
}

export function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralCode = normalizeReferralCode(
      params.get('ref') || params.get('ref_code') || params.get('referral_code')
    );
    if (!referralCode) return;
    setCookie('ref_code', referralCode, REFERRAL_COOKIE_DAYS);
  }, []);

  return null;
}
