import {
  createPartnerSupplier,
  normalizeChannelCode,
  normalizePartnerId,
  suggestPartnerId,
  updatePartnerSupplierStatus,
} from '@/shared/models/partner';
import { findUserByEmail } from '@/shared/models/user';
import {
  assignRoleToUser,
  createRole,
  getRoleByName,
  getUserRoles,
  ROLES,
  RoleStatus,
} from '@/shared/services/rbac';
import { revalidatePath } from 'next/cache';

import { PERMISSIONS, requirePermission } from '@/core/rbac';

async function requirePartnerSupplierWritePermission() {
  await requirePermission({ code: PERMISSIONS.USERS_WRITE });
}

async function ensureSupplierRole(userId: string) {
  let role = await getRoleByName(ROLES.PARTNER_SUPPLIER);
  if (!role) {
    role = await createRole({
      id: crypto.randomUUID(),
      name: ROLES.PARTNER_SUPPLIER,
      title: 'Partner Supplier',
      description: 'Partner supplier dashboard access',
      status: RoleStatus.ACTIVE,
      sort: 60,
    });
  }

  const roles = await getUserRoles(userId);
  if (!roles.some((item: any) => item.id === role.id)) {
    await assignRoleToUser(userId, role.id);
  }
}

function parseDate(value: FormDataEntryValue | null, fallback?: Date) {
  const raw = String(value || '').trim();
  if (!raw) return fallback || null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? fallback || null : date;
}

export async function createPartnerSupplierAction(formData: FormData) {
  try {
    await requirePartnerSupplierWritePermission();

    const name = String(formData.get('name') || '').trim();
    const userEmail = String(formData.get('user_email') || '')
      .trim()
      .toLowerCase();
    const partnerId =
      normalizePartnerId(String(formData.get('partner_id') || '')) ||
      suggestPartnerId(name);
    const channelCode =
      normalizeChannelCode(String(formData.get('channel_code') || '')) ||
      partnerId;
    const defaultVariantId =
      String(formData.get('default_variant_id') || '').trim() || 'official';
    const priceRuleType =
      String(formData.get('price_rule_type') || 'percent_off') === 'fixed_unit'
        ? 'fixed_unit'
        : 'percent_off';
    const priceRuleValue = Math.max(
      0,
      Math.floor(Number(formData.get('price_rule_value') || 0))
    );
    const contractStartAt = parseDate(
      formData.get('contract_start_at'),
      new Date()
    );
    const contractEndAt = parseDate(formData.get('contract_end_at'));
    const notes = String(formData.get('notes') || '').trim();

    if (!name) {
      throw new Error('供应商名称不能为空');
    }
    if (!userEmail) {
      throw new Error('绑定账号邮箱不能为空');
    }
    if (!partnerId) {
      throw new Error('partnerId 不能为空');
    }
    if (priceRuleType === 'percent_off' && priceRuleValue > 100) {
      throw new Error('折扣比例不能超过 100');
    }

    const user = await findUserByEmail(userEmail);
    if (!user) {
      throw new Error('绑定账号不存在，请先让供应商完成注册');
    }

    await createPartnerSupplier({
      name,
      partnerId,
      channelCode,
      userId: user.id,
      userEmail: user.email,
      status: 'active',
      contractStartAt: contractStartAt || new Date(),
      contractEndAt,
      defaultVariantId,
      priceRuleType,
      priceRuleValue,
      notes,
    });
    await ensureSupplierRole(user.id);

    revalidatePath('/admin/partners');
  } catch (error: any) {
    throw new Error(error?.message || '创建供应商失败');
  }
}

export async function updatePartnerSupplierStatusAction(formData: FormData) {
  try {
    await requirePartnerSupplierWritePermission();

    const id = String(formData.get('id') || '').trim();
    const status = String(formData.get('status') || '').trim();
    if (!id) {
      throw new Error('供应商 ID 不能为空');
    }
    if (status !== 'active' && status !== 'disabled') {
      throw new Error('供应商状态无效');
    }

    await updatePartnerSupplierStatus({
      id,
      status,
    });
    revalidatePath('/admin/partners');
  } catch (error: any) {
    throw new Error(error?.message || '更新状态失败');
  }
}
