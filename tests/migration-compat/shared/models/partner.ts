type PartnerCheckoutAmountInput = {
  unitAmount: number;
  seats: number;
  priceRuleType?: string | null;
  priceRuleValue?: number | null;
};

export function normalizePartnerId(value: string) {
  return normalizeSlug(value);
}

export function normalizeChannelCode(value: string) {
  return normalizeSlug(value);
}

export function calculatePartnerCheckoutAmount({
  unitAmount,
  seats,
  priceRuleType,
  priceRuleValue,
}: PartnerCheckoutAmountInput) {
  if (priceRuleType === 'fixed_unit') {
    return Math.max(0, Math.round((priceRuleValue || 0) * seats));
  }

  if (priceRuleType === 'percent_off') {
    const percent = Math.max(0, Math.min(100, priceRuleValue || 0));
    return Math.max(0, Math.round(unitAmount * seats * (1 - percent / 100)));
  }

  return Math.max(0, Math.round(unitAmount * seats));
}

export function isSupplierCurrentlyActive(supplier: any, now = new Date()) {
  if (!supplier || supplier.deletedAt) return false;
  if (supplier.status !== 'active') return false;
  if (supplier.contractStartAt && supplier.contractStartAt > now) return false;
  if (supplier.contractEndAt && supplier.contractEndAt < now) return false;
  return true;
}

export function findPartnerSupplierByPartnerId() {
  return Promise.resolve(undefined);
}

export function findPartnerSupplierByChannelCode() {
  return Promise.resolve(undefined);
}

export function findPartnerSupplierByUserId() {
  return Promise.resolve(undefined);
}

export function getPartnerCredentials() {
  return Promise.resolve([]);
}

export function createPartnerSupplier() {
  return Promise.resolve(null);
}

export function updatePartnerSupplierStatus() {
  return Promise.resolve(null);
}

export function suggestPartnerId(name: string) {
  return `partner-${normalizeSlug(name)}`;
}

function normalizeSlug(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}
