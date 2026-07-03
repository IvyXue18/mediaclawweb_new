import { migrationPending } from '../../pending';

export function getUserInfo() {
  return migrationPending('user.getUserInfo');
}

export function getSignUser() {
  return migrationPending('user.getSignUser');
}

export function findUserByEmail() {
  return migrationPending('user.findUserByEmail');
}
