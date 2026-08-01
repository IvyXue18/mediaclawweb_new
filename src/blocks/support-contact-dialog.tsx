import { MessageCircle } from 'lucide-react';

import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SupportChannel {
  id: string;
  label: string;
  description: string;
  icon: typeof MessageCircle;
  qrCodeUrl?: string;
  qrCodeAlt?: string;
  note?: string;
  href?: string;
  actionLabel?: string;
}

export function SupportContactDialog() {
  // Add Discord or another channel here later; the dialog automatically gains
  // another switch and supports either a QR code or an external action link.
  const channels: SupportChannel[] = [
    {
      id: 'wechat',
      label: m['settings.tickets.contact_wechat'](),
      description: m['settings.tickets.contact_wechat_description'](),
      icon: MessageCircle,
      qrCodeUrl: '/wechat.png',
      qrCodeAlt: m['settings.tickets.contact_wechat_qr_alt'](),
      note: m['settings.tickets.contact_wechat_note'](),
    },
  ];

  return (
    <Dialog>
      <DialogTrigger render={<Button className="gap-2" />}>
        <MessageCircle className="size-4" />
        {m['settings.tickets.contact_button']()}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{m['settings.tickets.contact_title']()}</DialogTitle>
          <DialogDescription>
            {m['settings.tickets.contact_description']()}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={channels[0].id}>
          <TabsList className="grid h-auto w-full auto-cols-fr grid-flow-col">
            {channels.map((channel) => {
              const Icon = channel.icon;
              return (
                <TabsTrigger
                  key={channel.id}
                  value={channel.id}
                  className="min-h-8"
                >
                  <Icon className="size-4" />
                  {channel.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {channels.map((channel) => (
            <TabsContent key={channel.id} value={channel.id}>
              <div className="flex flex-col items-center gap-4 py-3 text-center">
                <p className="text-muted-foreground text-sm">
                  {channel.description}
                </p>
                {channel.qrCodeUrl && (
                  <div className="border-border overflow-hidden rounded-2xl border bg-white p-3 shadow-sm">
                    <img
                      src={channel.qrCodeUrl}
                      alt={channel.qrCodeAlt || ''}
                      className="size-64 max-w-full object-contain"
                    />
                  </div>
                )}
                {channel.href && channel.actionLabel && (
                  <Button
                    render={
                      <a
                        href={channel.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    {channel.actionLabel}
                  </Button>
                )}
                {channel.note && (
                  <p className="text-muted-foreground text-xs">
                    {channel.note}
                  </p>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
