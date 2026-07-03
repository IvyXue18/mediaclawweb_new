import {
  createPartnerSupplierAction,
  updatePartnerSupplierStatusAction,
} from '@/app/[locale]/(admin)/admin/partners/actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  revalidatePath: vi.fn(),
  createPartnerSupplier: vi.fn(),
  updatePartnerSupplierStatus: vi.fn(),
  findUserByEmail: vi.fn(),
  getRoleByName: vi.fn(),
  createRole: vi.fn(),
  getUserRoles: vi.fn(),
  assignRoleToUser: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => mocks.revalidatePath(...args),
}));

vi.mock('@/core/rbac', () => ({
  PERMISSIONS: {
    USERS_WRITE: 'users.write',
  },
  requirePermission: (...args: any[]) => mocks.requirePermission(...args),
}));

vi.mock('@/shared/models/partner', () => ({
  normalizePartnerId: (value: string) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48),
  normalizeChannelCode: (value: string) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48),
  suggestPartnerId: (name: string) =>
    `partner-${String(name || '')
      .trim()
      .toLowerCase()}`,
  createPartnerSupplier: (...args: any[]) =>
    mocks.createPartnerSupplier(...args),
  updatePartnerSupplierStatus: (...args: any[]) =>
    mocks.updatePartnerSupplierStatus(...args),
}));

vi.mock('@/shared/models/user', () => ({
  findUserByEmail: (...args: any[]) => mocks.findUserByEmail(...args),
}));

vi.mock('@/shared/services/rbac', () => ({
  ROLES: {
    PARTNER_SUPPLIER: 'partner_supplier',
  },
  RoleStatus: {
    ACTIVE: 'active',
  },
  getRoleByName: (...args: any[]) => mocks.getRoleByName(...args),
  createRole: (...args: any[]) => mocks.createRole(...args),
  getUserRoles: (...args: any[]) => mocks.getUserRoles(...args),
  assignRoleToUser: (...args: any[]) => mocks.assignRoleToUser(...args),
}));

function form(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

describe('partner supplier admin actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUserByEmail.mockResolvedValue({
      id: 'supplier-user',
      email: 'supplier@example.com',
    });
    mocks.getRoleByName.mockResolvedValue(null);
    mocks.createRole.mockResolvedValue({
      id: 'role-partner-supplier',
      name: 'partner_supplier',
    });
    mocks.getUserRoles.mockResolvedValue([]);
    mocks.createPartnerSupplier.mockResolvedValue({ id: 'supplier-1' });
    mocks.updatePartnerSupplierStatus.mockResolvedValue({ id: 'supplier-1' });
  });

  it('creates a supplier, normalizes channel identifiers, and assigns the supplier role', async () => {
    await createPartnerSupplierAction(
      form({
        name: 'Supplier One',
        user_email: 'Supplier@Example.com',
        partner_id: ' Supplier One! ',
        channel_code: ' Supplier Buy! ',
        default_variant_id: 'supplier-one-white-label',
        price_rule_type: 'percent_off',
        price_rule_value: '20',
        contract_start_at: '2026-06-01',
        notes: 'B-side pilot',
      })
    );

    expect(mocks.requirePermission).toHaveBeenCalledWith({
      code: 'users.write',
    });
    expect(mocks.findUserByEmail).toHaveBeenCalledWith('supplier@example.com');
    expect(mocks.createPartnerSupplier).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Supplier One',
        partnerId: 'supplier-one',
        channelCode: 'supplier-buy',
        userId: 'supplier-user',
        userEmail: 'supplier@example.com',
        status: 'active',
        defaultVariantId: 'supplier-one-white-label',
        priceRuleType: 'percent_off',
        priceRuleValue: 20,
        notes: 'B-side pilot',
      })
    );
    expect(mocks.createRole).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'partner_supplier',
        status: 'active',
      })
    );
    expect(mocks.assignRoleToUser).toHaveBeenCalledWith(
      'supplier-user',
      'role-partner-supplier'
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/partners');
  });

  it('rejects invalid supplier discount percentages before writing', async () => {
    await expect(
      createPartnerSupplierAction(
        form({
          name: 'Supplier One',
          user_email: 'supplier@example.com',
          partner_id: 'supplier-one',
          price_rule_type: 'percent_off',
          price_rule_value: '101',
        })
      )
    ).rejects.toThrow('折扣比例不能超过 100');

    expect(mocks.createPartnerSupplier).not.toHaveBeenCalled();
    expect(mocks.assignRoleToUser).not.toHaveBeenCalled();
  });

  it('rejects invalid supplier status updates before writing', async () => {
    await expect(
      updatePartnerSupplierStatusAction(
        form({
          id: 'supplier-1',
          status: 'archived',
        })
      )
    ).rejects.toThrow('供应商状态无效');

    expect(mocks.updatePartnerSupplierStatus).not.toHaveBeenCalled();
  });
});
