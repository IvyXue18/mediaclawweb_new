export function shouldUseDirectButtonUrl(item: any) {
  return Number(item?.amount || 0) <= 0 && Boolean(item?.button?.url);
}

export function shouldValidateCustomCredential(params: {
  purchaseMode?: string;
  isCreditsGroup?: boolean;
  isCustomInput?: boolean;
}) {
  return Boolean(
    params.isCustomInput &&
    (params.purchaseMode === 'renew' || params.isCreditsGroup)
  );
}

export function isTrialCredential(credential: any) {
  return String(credential?.planCode || '').toLowerCase() === 'trial';
}
