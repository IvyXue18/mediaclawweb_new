import { describe, expect, it } from 'vitest';

import { createQrSvg } from '@/lib/qr-code';

describe('qr code generation', () => {
  it('generates an svg qr code for payment handoff content', () => {
    const svg = createQrSvg(
      'https://zpayz.cn/submit.php?out_trade_no=ORDER-QR-1&money=0.01'
    );

    expect(svg).toContain('<svg');
    expect(svg).toContain('<path');
    expect(svg).toContain('viewBox=');
  });

  it('rejects empty qr code content', () => {
    expect(() => createQrSvg('')).toThrow('QR data is required');
  });
});
