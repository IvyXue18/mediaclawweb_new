export type ReferralProgramConfig = {
  enabled: boolean;
  firstOrderRate: number;
  renewalRate: number;
  inviteeDiscount: number;
  minSettlement: number;
  lockDays: number;
  maxRefundRate: number;
};

export const DEFAULT_REFERRAL_CONFIG: ReferralProgramConfig = {
  enabled: true,
  firstOrderRate: 20,
  renewalRate: 20,
  inviteeDiscount: 10,
  minSettlement: 10000,
  lockDays: 7,
  maxRefundRate: 30,
};

function parsePercentage(value: unknown, fallback: number) {
  if (value === '' || value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
    ? Math.floor(parsed)
    : fallback;
}

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function resolveReferralConfig(
  configs: Record<string, string | undefined>
): ReferralProgramConfig {
  return {
    enabled: configs.referral_enabled !== 'false',
    firstOrderRate: parsePercentage(
      configs.referral_first_order_rate,
      DEFAULT_REFERRAL_CONFIG.firstOrderRate
    ),
    renewalRate: parsePercentage(
      configs.referral_renewal_rate,
      DEFAULT_REFERRAL_CONFIG.renewalRate
    ),
    inviteeDiscount: parsePercentage(
      configs.referral_invitee_discount,
      DEFAULT_REFERRAL_CONFIG.inviteeDiscount
    ),
    minSettlement: parsePositiveInt(
      configs.referral_min_settlement,
      DEFAULT_REFERRAL_CONFIG.minSettlement
    ),
    lockDays: parsePositiveInt(
      configs.referral_lock_days,
      DEFAULT_REFERRAL_CONFIG.lockDays
    ),
    maxRefundRate: parsePercentage(
      configs.referral_max_refund_rate,
      DEFAULT_REFERRAL_CONFIG.maxRefundRate
    ),
  };
}
