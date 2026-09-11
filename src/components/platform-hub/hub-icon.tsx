import type { ComponentType } from 'react';
import {
  AudioLines,
  Bot,
  Database,
  Download,
  FileChartColumn,
  ImageDown,
  MessageCircle,
  Radar,
  ScanText,
  Search,
  Sparkles,
  Table2,
  TrendingUp,
  UserCheck,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

import { CodexIcon, FeishuIcon, WorkBuddyIcon } from '@/components/brand-icons';

import type { HubIconName } from './types';

const icons: Record<
  HubIconName,
  LucideIcon | ComponentType<{ className?: string }>
> = {
  audio: AudioLines,
  bot: Bot,
  codex: CodexIcon,
  database: Database,
  download: Download,
  imageText: ScanText,
  keywords: Search,
  leads: UserCheck,
  messages: MessageCircle,
  monitoring: Radar,
  reports: FileChartColumn,
  sparkles: Sparkles,
  feishu: FeishuIcon,
  table: Table2,
  trending: TrendingUp,
  users: Users,
  workflow: Workflow,
  workbuddy: WorkBuddyIcon,
};

export function HubIcon({
  name,
  className,
}: {
  name: HubIconName;
  className?: string;
}) {
  const Icon = icons[name] ?? ImageDown;
  return <Icon aria-hidden="true" className={className} />;
}
