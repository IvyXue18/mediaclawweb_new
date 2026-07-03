import { createFileRoute } from '@tanstack/react-router';

import { filterPublicConfigs, getAllConfigs } from '@/modules/config/service';
import { respData, respErr } from '@/lib/resp';

const publicKeys = [
  'email_auth_enabled',
  'email_verification_enabled',
  'google_auth_enabled',
  'google_one_tap_enabled',
  'google_client_id',
  'github_auth_enabled',
  'select_payment_enabled',
  'default_payment_provider',
  'stripe_enabled',
  'creem_enabled',
  'paypal_enabled',
  'zpay_enabled',
  'affonso_enabled',
  'promotekit_enabled',
  'crisp_enabled',
  'tawk_enabled',
  'referral_enabled',
  'referral_first_order_rate',
  'referral_renewal_rate',
  'referral_invitee_discount',
  'referral_min_settlement',
  'referral_lock_days',
  'referral_max_refund_rate',
];

async function POST() {
  try {
    const configs = await getAllConfigs();
    return respData(filterPublicConfigs(configs, publicKeys));
  } catch (error: any) {
    return respErr(error.message || 'get configs failed');
  }
}

export const Route = createFileRoute('/api/config/get-configs')({
  server: { handlers: { POST } },
});
