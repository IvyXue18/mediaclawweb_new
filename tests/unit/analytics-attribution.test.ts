import { describe, expect, it } from 'vitest';

import {
  deriveAttributionTouch,
  mergeAttributionState,
  parseAttributionEnvelope,
  serializeAttributionEnvelope,
} from '@/lib/analytics-attribution';

describe('analytics attribution', () => {
  it('captures campaign and content parameters deterministically', () => {
    const touch = deriveAttributionTouch({
      pageUrl:
        'https://mediaclaw.app/pricing?utm_source=wechat&utm_medium=article&utm_campaign=launch&utm_content=agent-001',
      referrer: 'https://mp.weixin.qq.com/s?secret=should-not-be-stored',
      now: new Date('2026-07-13T00:00:00.000Z'),
    });

    expect(touch).toMatchObject({
      channel: 'wechat',
      source: 'wechat',
      medium: 'article',
      campaign: 'launch',
      content: 'agent-001',
      evidence: 'campaign',
      confidence: 'deterministic',
      referrer: 'https://mp.weixin.qq.com/s',
    });
  });

  it('falls back to channel-only referrer evidence', () => {
    const touch = deriveAttributionTouch({
      pageUrl: 'https://mediaclaw.app/',
      referrer: 'https://mp.weixin.qq.com/s?__biz=private',
    });

    expect(touch.channel).toBe('wechat');
    expect(touch.evidence).toBe('referrer');
    expect(touch.confidence).toBe('channel_only');
    expect(touch.referrer).toBe('https://mp.weixin.qq.com/s');
  });

  it('labels an unreferenced WeChat webview as inferred', () => {
    const touch = deriveAttributionTouch({
      pageUrl: 'https://mediaclaw.app/',
      userAgent: 'Mozilla/5.0 MicroMessenger/8.0',
    });

    expect(touch).toMatchObject({
      channel: 'wechat',
      evidence: 'environment',
      confidence: 'inferred',
    });
  });

  it('does not let a later direct visit overwrite last non-direct touch', () => {
    const campaign = deriveAttributionTouch({
      pageUrl: 'https://mediaclaw.app/?utm_source=x&utm_campaign=launch',
      now: new Date('2026-07-01T00:00:00.000Z'),
    });
    const direct = deriveAttributionTouch({
      pageUrl: 'https://mediaclaw.app/pricing',
      now: new Date('2026-07-02T00:00:00.000Z'),
    });
    const initial = mergeAttributionState(null, campaign);
    const merged = mergeAttributionState(
      initial,
      direct,
      new Date('2026-07-02T00:00:00.000Z')
    );

    expect(merged.firstTouch.channel).toBe('x');
    expect(merged.lastTouch.channel).toBe('x');
  });

  it('round-trips a persisted attribution envelope', () => {
    const touch = deriveAttributionTouch({
      pageUrl: 'https://mediaclaw.app/?source=extension',
    });
    const envelope = {
      ...mergeAttributionState(null, touch),
      anonymousId: 'anonymous-1',
      sessionId: 'session-1',
    };

    expect(
      parseAttributionEnvelope(serializeAttributionEnvelope(envelope))
    ).toMatchObject({
      anonymousId: 'anonymous-1',
      sessionId: 'session-1',
      lastTouch: { channel: 'extension' },
    });
  });
});
