import { generateActivationCode } from '@/shared/models/credential';
import { describe, expect, it } from 'vitest';

describe('credential business rules', () => {
  it('generates activation codes in the public ACT-XXXX-XXXX-XXXX format', () => {
    for (let i = 0; i < 20; i += 1) {
      const code = generateActivationCode();

      expect(code).toMatch(
        /^ACT-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/
      );
      expect(code).not.toMatch(/[IO01]/);
    }
  });
});
