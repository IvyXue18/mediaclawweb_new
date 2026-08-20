'use client';

import { LogOutIcon, SettingsIcon, ShieldIcon } from 'lucide-react';

import { signOut, useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { formatLoginIdentifier } from '@/lib/auth-identifier';
import { m } from '@/paraglide/messages.js';
import { useTicketAttention } from '@/hooks/use-ticket-attention';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SiteUserMenu({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image?: string | null;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { data } = useUserPermissions();
  const isAdmin = data?.isAdmin === true;
  const ticketAttention = useTicketAttention(
    'admin',
    isAdmin,
    session?.user.id
  );
  const hasPendingTickets = (ticketAttention.data?.total ?? 0) > 0;
  const identifier = formatLoginIdentifier(email);

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus-visible:ring-ring relative rounded-full outline-none focus-visible:ring-2">
        <Avatar className="size-9">
          <AvatarImage src={image || undefined} alt={name} />
          <AvatarFallback className="text-xs">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {hasPendingTickets && (
          <span
            className="bg-destructive ring-background absolute top-0 right-0 size-2.5 rounded-full ring-2"
            aria-label={m['admin.nav.ticket_alert']()}
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-8">
                <AvatarImage src={image || undefined} alt={name} />
                <AvatarFallback className="text-xs">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {identifier}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          <SettingsIcon className="size-4" />
          {m['common.nav.settings']()}
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <ShieldIcon className="size-4" />
            <span className="flex-1">{m['common.systems.admin']()}</span>
            {hasPendingTickets && (
              <span
                className="bg-destructive size-2 rounded-full"
                aria-hidden="true"
              />
            )}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOutIcon className="size-4" />
          {m['common.sign.sign_out_title']()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
