import { migrationPending } from '../../pending';

export { calculateCreditExpirationTime } from '@/modules/credits/service';

export enum CreditStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DELETED = 'deleted',
}

export enum CreditTransactionScene {
  PAYMENT = 'payment',
  SUBSCRIPTION = 'subscription',
  RENEWAL = 'renewal',
  GIFT = 'gift',
  REWARD = 'reward',
}

export enum CreditTransactionType {
  GRANT = 'grant',
  CONSUME = 'consume',
  EXPENSE = 'expense',
}

export function updateCreditCredentialCodeByOrderNo() {
  return migrationPending('credit.updateCreditCredentialCodeByOrderNo');
}

export function getCreditDetailRetentionDays(configs: Record<string, string>) {
  const parsed = Number(configs.credit_detail_retention_days);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 90;
}

export function getCreditSummaryCutoffMonth(retentionDays: number) {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - retentionDays);
  return new Date(
    Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth(), 1, 0, 0, 0, 0)
  );
}
