import { migrationPending } from '../../pending';

export enum CommissionStatus {
  PENDING = 'pending',
  LOCKED = 'locked',
  SETTLED = 'settled',
  CANCELED = 'canceled',
}

export enum CommissionType {
  FIRST_ORDER = 'first_order',
  RENEWAL = 'renewal',
}

export enum ReferralStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export enum ReferralTaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DONE = 'done',
}

export enum WithdrawalStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REJECTED = 'rejected',
}

export function createReferralWithdrawal() {
  return migrationPending('referral.createReferralWithdrawal');
}

export function decreasePendingBalance() {
  return migrationPending('referral.decreasePendingBalance');
}

export function findPendingWithdrawalByUserId() {
  return migrationPending('referral.findPendingWithdrawalByUserId');
}

export function findReferralWithdrawalById() {
  return migrationPending('referral.findReferralWithdrawalById');
}

export function findCommissionByOrderNo() {
  return migrationPending('referral.findCommissionByOrderNo');
}

export function findReferralRelationByReferee() {
  return migrationPending('referral.findReferralRelationByReferee');
}

export function getOrCreateReferralBalance() {
  return migrationPending('referral.getOrCreateReferralBalance');
}

export function getReferralConfig() {
  return migrationPending('referral.getReferralConfig');
}

export function getReferralStatus() {
  return migrationPending('referral.getReferralStatus');
}

export function getPendingReferralTasks() {
  return migrationPending('referral.getPendingReferralTasks');
}

export function increasePendingBalance() {
  return migrationPending('referral.increasePendingBalance');
}

export function markReferralTaskDone() {
  return migrationPending('referral.markReferralTaskDone');
}

export function moveAvailableToWithdrawing() {
  return migrationPending('referral.moveAvailableToWithdrawing');
}

export function moveLockedToAvailable() {
  return migrationPending('referral.moveLockedToAvailable');
}

export function movePendingToLocked() {
  return migrationPending('referral.movePendingToLocked');
}

export function moveWithdrawingToAvailable() {
  return migrationPending('referral.moveWithdrawingToAvailable');
}

export function moveWithdrawingToWithdrawn() {
  return migrationPending('referral.moveWithdrawingToWithdrawn');
}

export function updateReferralWithdrawalStatus() {
  return migrationPending('referral.updateReferralWithdrawalStatus');
}

export function updateReferralStatus() {
  return migrationPending('referral.updateReferralStatus');
}

export function updateReferralTaskStatus() {
  return migrationPending('referral.updateReferralTaskStatus');
}

export function upsertReferralTask() {
  return migrationPending('referral.upsertReferralTask');
}

export function updateCommissionStatus() {
  return migrationPending('referral.updateCommissionStatus');
}
