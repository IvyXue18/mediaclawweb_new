export function hasPermission() {
  return Promise.resolve(false);
}

export const ROLES = {
  PARTNER_SUPPLIER: 'partner_supplier',
};

export enum RoleStatus {
  ACTIVE = 'active',
}

export function getRoleByName() {
  return Promise.resolve(null);
}

export function createRole(values: any) {
  return Promise.resolve(values);
}

export function getUserRoles() {
  return Promise.resolve([]);
}

export function assignRoleToUser() {
  return Promise.resolve();
}
