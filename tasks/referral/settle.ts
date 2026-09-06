import { defineTask } from 'nitro/task';

import { withDbRequestScope } from '@/core/db';
import { processLockedCommissionsSettlement } from '@/modules/referral/service';

export default defineTask({
  meta: {
    name: 'referral:settle',
    description: 'Settle referral commissions whose lock period has expired',
  },
  async run() {
    const result = await withDbRequestScope(() =>
      processLockedCommissionsSettlement()
    );

    console.info('[referral:settle] completed', result);
    return { result };
  },
});
