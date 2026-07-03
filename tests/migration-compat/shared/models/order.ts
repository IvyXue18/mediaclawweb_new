import { migrationPending } from '../../pending';

export enum OrderStatus {
  PENDING = 'pending',
  CREATED = 'created',
  COMPLETED = 'completed',
  PAID = 'paid',
  FAILED = 'failed',
}

export enum OrderCredentialAction {
  NONE = 'none',
  ISSUE = 'issue',
  RECHARGE = 'recharge',
}

export enum OrderCredentialSyncStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DONE = 'done',
  FAILED = 'failed',
}

export function createOrder() {
  return migrationPending('order.createOrder');
}

export function updateOrderByOrderNo() {
  return migrationPending('order.updateOrderByOrderNo');
}

export function beginOrderCredentialSync() {
  return migrationPending('order.beginOrderCredentialSync');
}

export function updateOrderInTransaction() {
  return migrationPending('order.updateOrderInTransaction');
}

export function findOrderByOrderNo() {
  return migrationPending('order.findOrderByOrderNo');
}

export function findOrderByTransactionId() {
  return migrationPending('order.findOrderByTransactionId');
}
