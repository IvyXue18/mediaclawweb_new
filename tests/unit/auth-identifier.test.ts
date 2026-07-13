import { describe, expect, it } from 'vitest';

import {
  formatLoginIdentifier,
  getPhoneFromAuthEmail,
  resolveLoginIdentifier,
} from '@/lib/auth-identifier';

describe('auth identifier helpers', () => {
  it('maps mainland phone numbers to the local phone auth email', () => {
    expect(resolveLoginIdentifier('18518257525')).toBe(
      '18518257525@phone-auth.mediaclaw.local'
    );
    expect(resolveLoginIdentifier('+86 185 1825 7525')).toBe(
      '18518257525@phone-auth.mediaclaw.local'
    );
  });

  it('keeps real emails as normalized email identifiers', () => {
    expect(resolveLoginIdentifier(' User@Example.COM ')).toBe(
      'user@example.com'
    );
  });

  it('formats phone auth emails as user-facing phone numbers', () => {
    expect(
      getPhoneFromAuthEmail('18518257525@phone-auth.mediaclaw.local')
    ).toBe('18518257525');
    expect(
      formatLoginIdentifier('18518257525@phone-auth.mediaclaw.local')
    ).toBe('18518257525');
    expect(formatLoginIdentifier('user@example.com')).toBe('user@example.com');
  });
});
