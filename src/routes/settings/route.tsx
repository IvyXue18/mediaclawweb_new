import { createFileRoute, Outlet } from '@tanstack/react-router';
import {
  CreditCard,
  Gift,
  Home,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Sparkles,
} from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { useTicketAttention } from '@/hooks/use-ticket-attention';
import { SupportWidget } from '@/blocks/support-widget';
import { AppLayout } from '@/components/app-layout';

export const Route = createFileRoute('/settings')({
  component: SettingsLayout,
});

function SettingsLayout() {
  const { data: session } = useSession();
  const ticketAttention = useTicketAttention(
    'user',
    !!session?.user,
    session?.user.id
  );
  const hasTicketReply = (ticketAttention.data?.total ?? 0) > 0;
  const group = m['common.systems.settings']();
  const navItems = [
    {
      href: '/settings',
      label: m['settings.nav.overview'](),
      icon: LayoutDashboard,
      group,
    },
    {
      href: '/settings/credentials',
      label: m['settings.nav.credentials'](),
      icon: KeyRound,
      group,
    },
    {
      href: '/settings/payments',
      label: m['settings.nav.billing_history'](),
      icon: CreditCard,
      group,
      items: [
        { href: '/settings/payments', label: m['settings.nav.payments']() },
        { href: '/settings/credits', label: m['settings.nav.credits']() },
      ],
    },
    {
      href: '/welfare?entry=settings_nav',
      label: m['settings.nav.welfare'](),
      icon: Sparkles,
      group,
    },
    {
      href: '/settings/referral',
      label: m['settings.nav.referral'](),
      icon: Gift,
      group,
    },
  ];

  const footerNavItems = [
    {
      href: '/settings/tickets',
      label: m['settings.nav.tickets'](),
      icon: LifeBuoy,
      attention: hasTicketReply,
      attentionLabel: m['settings.nav.ticket_reply_alert'](),
    },
    { href: '/', label: m['common.systems.home'](), icon: Home, newTab: true },
  ];

  return (
    <AppLayout
      navItems={navItems}
      footerNavItems={footerNavItems}
      brand={envConfigs.app_name}
      brandHref="/settings"
      profileHref="/settings/profile"
      securityHref="/settings/security"
    >
      <Outlet />
      <SupportWidget />
    </AppLayout>
  );
}
