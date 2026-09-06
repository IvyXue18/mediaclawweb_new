import { describe, expect, it } from 'vitest';

import {
  buildPluginMessageReceiptPatch,
  cleanPluginMessageMarkdown,
  comparePluginVersions,
  matchesPluginMessageAudience,
  parsePluginMessageAudience,
  shouldSuppressReviewInvite,
} from '@/modules/plugin-messages/service';

const context = {
  authStatus: 'bound',
  planCode: 'pro',
  variantId: 'official',
  locale: 'zh',
  userId: 'user-1',
  appVersion: '0.3.2',
  usageDays: 8,
  successfulOperationCount: 12,
  outputActionCount: 3,
};

describe('plugin message audience rules', () => {
  it('preserves safe rich-text line structure without accepting control characters', () => {
    expect(
      cleanPluginMessageMarkdown(
        '正文第一段\r\n\r\n> **重点** 提示\u0000\n- 第一项\n- 第二项'
      )
    ).toBe('正文第一段\n\n> **重点** 提示\n- 第一项\n- 第二项');
  });

  it('matches an unrestricted message and rejects mismatched trusted segments', () => {
    expect(matchesPluginMessageAudience({}, context)).toBe(true);
    expect(
      matchesPluginMessageAudience({ authStatuses: ['unbound'] }, context)
    ).toBe(false);
    expect(
      matchesPluginMessageAudience(
        {
          authStatuses: ['bound'],
          planCodes: ['pro'],
          variantIds: ['official'],
          locales: ['zh'],
          userIds: ['user-1'],
        },
        context
      )
    ).toBe(true);
  });

  it('applies inclusive extension version ranges', () => {
    expect(comparePluginVersions('0.3.10', '0.3.2')).toBe(1);
    expect(
      matchesPluginMessageAudience(
        { minAppVersion: '0.3.0', maxAppVersion: '0.3.2' },
        context
      )
    ).toBe(true);
    expect(
      matchesPluginMessageAudience({ minAppVersion: '0.4.0' }, context)
    ).toBe(false);
  });

  it('normalizes invalid or oversized audience input to allowlisted fields', () => {
    expect(
      parsePluginMessageAudience(
        JSON.stringify({
          authStatuses: ['bound', 'super-admin'],
          locales: ['ZH'],
          arbitrarySql: 'select * from user',
        })
      )
    ).toEqual({
      authStatuses: ['bound'],
      planCodes: [],
      variantIds: [],
      locales: ['zh'],
      userIds: [],
      minAppVersion: '',
      maxAppVersion: '',
      minUsageDays: 0,
      minSuccessfulOperations: 0,
      requireOutputAction: false,
      reviewCycle: '',
    });
  });

  it('matches review invites only after objective usage maturity', () => {
    const audience = {
      authStatuses: ['bound'],
      minUsageDays: 3,
      minSuccessfulOperations: 5,
      requireOutputAction: true,
      reviewCycle: '0.3',
    };
    expect(matchesPluginMessageAudience(audience, context)).toBe(true);
    expect(
      matchesPluginMessageAudience(audience, { ...context, usageDays: 2 })
    ).toBe(false);
    expect(
      matchesPluginMessageAudience(audience, {
        ...context,
        outputActionCount: 0,
      })
    ).toBe(false);
  });

  it('suppresses the same review cycle forever and other cycles for 90 days', () => {
    const now = new Date('2026-09-06T00:00:00.000Z');
    const recentInvite = new Date('2026-08-01T00:00:00.000Z');
    const oldInvite = new Date('2026-01-01T00:00:00.000Z');
    expect(
      shouldSuppressReviewInvite({
        candidateId: 'review-2',
        candidateCycle: '0.3',
        history: [
          {
            messageId: 'review-1',
            reviewCycle: '0.3',
            firstImpressionAt: oldInvite,
          },
        ],
        now,
      })
    ).toBe(true);
    expect(
      shouldSuppressReviewInvite({
        candidateId: 'review-2',
        candidateCycle: '0.4',
        history: [
          {
            messageId: 'review-1',
            reviewCycle: '0.3',
            dismissedAt: recentInvite,
          },
        ],
        now,
      })
    ).toBe(true);
    expect(
      shouldSuppressReviewInvite({
        candidateId: 'review-2',
        candidateCycle: '0.4',
        history: [
          {
            messageId: 'review-1',
            reviewCycle: '0.3',
            actionClickedAt: oldInvite,
          },
        ],
        now,
      })
    ).toBe(false);
  });

  it('keeps re-alerted content unread when the new version is only impressed', () => {
    const oldDate = new Date('2026-09-01T08:00:00.000Z');
    const now = new Date('2026-09-02T08:00:00.000Z');
    expect(
      buildPluginMessageReceiptPatch({
        event: 'impression',
        contentVersion: 2,
        existing: {
          contentVersion: 1,
          firstImpressionAt: oldDate,
          readAt: oldDate,
          dismissedAt: oldDate,
          actionClickedAt: oldDate,
        },
        now,
      })
    ).toMatchObject({
      contentVersion: 2,
      firstImpressionAt: now,
      readAt: null,
      dismissedAt: null,
      actionClickedAt: null,
    });
  });
});
