import { migrationPending } from '../../pending';

export function findSubscriptionByProviderSubscriptionId() {
  return migrationPending(
    'subscription.findSubscriptionByProviderSubscriptionId'
  );
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
}

export function updateSubscriptionBySubscriptionNo() {
  return migrationPending('subscription.updateSubscriptionBySubscriptionNo');
}

export function updateSubscriptionInTransaction() {
  return migrationPending('subscription.updateSubscriptionInTransaction');
}
