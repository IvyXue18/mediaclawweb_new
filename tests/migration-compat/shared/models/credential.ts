import { randomBytes } from 'node:crypto';

import { migrationPending } from '../../pending';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateActivationCode() {
  const segments: string[] = [];

  for (let segment = 0; segment < 3; segment += 1) {
    let value = '';
    while (value.length < 4) {
      const byte = randomBytes(1)[0];
      if (byte < 256 - (256 % ALPHABET.length)) {
        value += ALPHABET[byte % ALPHABET.length];
      }
    }
    segments.push(value);
  }

  return `ACT-${segments.join('-')}`;
}

export function getUserManagedCredentials() {
  return migrationPending('credential.getUserManagedCredentials');
}

export function findCredentialByCode() {
  return migrationPending('credential.findCredentialByCode');
}

export function findCredentialBySourceOrderNo() {
  return migrationPending('credential.findCredentialBySourceOrderNo');
}

export function createCredential() {
  return migrationPending('credential.createCredential');
}

export function syncCredentialCreditSummary() {
  return migrationPending('credential.syncCredentialCreditSummary');
}

export function adminGenerateCredential() {
  return migrationPending('credential.adminGenerateCredential');
}

export function adminAddCreditsToCredential() {
  return migrationPending('credential.adminAddCreditsToCredential');
}

export function adminUpdateCredential() {
  return migrationPending('credential.adminUpdateCredential');
}

export function findCredentialByCodeAndOwner() {
  return migrationPending('credential.findCredentialByCodeAndOwner');
}
