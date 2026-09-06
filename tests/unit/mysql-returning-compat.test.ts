import { describe, expect, it } from 'vitest';

import { getMysqlAffectedRows } from '@/core/db/create-db';

describe('MySQL returning compatibility', () => {
  it('detects conditional updates that did not claim a row', () => {
    expect(getMysqlAffectedRows([{ affectedRows: 0 }])).toBe(0);
    expect(getMysqlAffectedRows({ affectedRows: 0 })).toBe(0);
  });

  it('preserves successful update and insert results', () => {
    expect(getMysqlAffectedRows([{ affectedRows: 1 }])).toBe(1);
    expect(getMysqlAffectedRows({ affectedRows: 2 })).toBe(2);
  });

  it('leaves unknown driver result shapes unchanged', () => {
    expect(getMysqlAffectedRows([])).toBeUndefined();
    expect(getMysqlAffectedRows(undefined)).toBeUndefined();
  });
});
