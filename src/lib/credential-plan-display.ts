import { m } from '@/paraglide/messages.js';

export type CredentialIssueType = 'formal' | 'trial';

export type CredentialPreset = {
  id: string;
  issueType: CredentialIssueType;
  planCode: string;
  label: () => string;
  durationDays: number;
  maxBindings: number;
  totalCredits: number;
};

export const CREDENTIAL_PRESETS: CredentialPreset[] = [
  {
    id: 'formal-custom',
    issueType: 'formal',
    planCode: 'formal',
    label: () => m['admin.credentials.preset_formal_custom'](),
    durationDays: 7,
    maxBindings: 1,
    totalCredits: 0,
  },
  {
    id: 'pro-1m',
    issueType: 'formal',
    planCode: 'pro-1m',
    label: () => m['admin.credentials.plan_pro_1m'](),
    durationDays: 30,
    maxBindings: 1,
    totalCredits: 180,
  },
  {
    id: 'pro-monthly',
    issueType: 'formal',
    planCode: 'pro-monthly',
    label: () => m['admin.credentials.plan_pro_3m'](),
    durationDays: 90,
    maxBindings: 1,
    totalCredits: 400,
  },
  {
    id: 'pro-yearly',
    issueType: 'formal',
    planCode: 'pro-yearly',
    label: () => m['admin.credentials.plan_pro_1y'](),
    durationDays: 365,
    maxBindings: 1,
    totalCredits: 1500,
  },
  {
    id: 'team-1m',
    issueType: 'formal',
    planCode: 'team-1m',
    label: () => m['admin.credentials.plan_team_1m'](),
    durationDays: 30,
    maxBindings: 3,
    totalCredits: 700,
  },
  {
    id: 'team-monthly',
    issueType: 'formal',
    planCode: 'team-monthly',
    label: () => m['admin.credentials.plan_team_3m'](),
    durationDays: 90,
    maxBindings: 3,
    totalCredits: 1500,
  },
  {
    id: 'team-yearly',
    issueType: 'formal',
    planCode: 'team-yearly',
    label: () => m['admin.credentials.plan_team_1y'](),
    durationDays: 365,
    maxBindings: 3,
    totalCredits: 5000,
  },
  {
    id: 'trial-7d',
    issueType: 'trial',
    planCode: 'trial',
    label: () => m['admin.credentials.preset_trial_7d'](),
    durationDays: 7,
    maxBindings: 1,
    totalCredits: 50,
  },
  {
    id: 'trial-14d',
    issueType: 'trial',
    planCode: 'trial',
    label: () => m['admin.credentials.preset_trial_14d'](),
    durationDays: 14,
    maxBindings: 1,
    totalCredits: 100,
  },
  {
    id: 'trial-custom',
    issueType: 'trial',
    planCode: 'trial',
    label: () => m['admin.credentials.preset_trial_custom'](),
    durationDays: 7,
    maxBindings: 1,
    totalCredits: 0,
  },
];

export const DEFAULT_PRESET_BY_TYPE: Record<CredentialIssueType, string> = {
  formal: 'formal-custom',
  trial: 'trial-7d',
};

export function getCredentialPreset(id: string) {
  return CREDENTIAL_PRESETS.find((preset) => preset.id === id);
}

export function getCredentialPresets(issueType: CredentialIssueType) {
  return CREDENTIAL_PRESETS.filter((preset) => preset.issueType === issueType);
}

export function credentialIssueTypeLabel(issueType?: string | null) {
  return issueType === 'trial'
    ? m['admin.credentials.issue_type_trial']()
    : m['admin.credentials.issue_type_formal']();
}

export function credentialPlanLabel(planCode?: string | null) {
  const normalized = String(planCode || '').trim();
  if (!normalized) return '-';
  if (normalized === 'formal') return m['admin.credentials.plan_formal']();
  if (normalized === 'trial') return m['admin.credentials.plan_trial']();
  if (normalized === 'custom') {
    return m['admin.credentials.preset_formal_custom']();
  }

  const preset = CREDENTIAL_PRESETS.find(
    (item) => item.planCode === normalized && !item.id.endsWith('custom')
  );
  return preset?.label() || m['admin.credentials.plan_unknown']();
}

export function credentialPresetSummary(preset: CredentialPreset) {
  return m['admin.credentials.preset_summary']({
    days: preset.durationDays,
    credits: preset.totalCredits,
    seats: preset.maxBindings,
  });
}
