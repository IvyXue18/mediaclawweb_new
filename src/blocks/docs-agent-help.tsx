import { useRef, useState } from 'react';
import { Bot, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function DocsAgentHelp({ inDialog = false }: { inDialog?: boolean }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const prompt = m['docs.agent_help.prompt']({
    appName: envConfigs.app_name,
    docsUrl: 'https://mediaclaw.app/docs.md',
  });

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success(m['docs.agent_help.copied']());
    } catch {
      setShowPrompt(true);
      toast.error(m['docs.agent_help.failed']());
      requestAnimationFrame(() => {
        promptRef.current?.focus();
        promptRef.current?.select();
      });
    }
  }

  return (
    <section
      className={
        inDialog
          ? ''
          : 'border-border bg-muted/30 mt-4 rounded-2xl border p-5 sm:p-6 xl:mt-0'
      }
    >
      <div
        className={
          inDialog
            ? 'flex flex-col gap-4'
            : 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'
        }
      >
        <div>
          {!inDialog && (
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Bot
                className="text-muted-foreground size-5 shrink-0"
                aria-hidden="true"
              />
              {m['docs.agent_help.title']()}
            </h2>
          )}
          <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-relaxed">
            {m['docs.agent_help.description']()}
          </p>
        </div>
        <Button onClick={copyPrompt} size="lg" variant="outline">
          <Copy aria-hidden="true" />
          {m['docs.agent_help.copy']()}
        </Button>
      </div>
      <details
        className="mt-3"
        open={showPrompt}
        onToggle={(event) => setShowPrompt(event.currentTarget.open)}
      >
        <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
          {m['docs.agent_help.preview']()}
        </summary>
        <textarea
          ref={promptRef}
          aria-label={m['docs.agent_help.preview']()}
          readOnly
          value={prompt}
          rows={12}
          className="border-border bg-background focus-visible:ring-ring mt-3 w-full rounded-lg border p-3 text-sm leading-relaxed focus-visible:ring-2 focus-visible:outline-none"
        />
      </details>
    </section>
  );
}

export function DocsAgentHelpAction() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-3 sm:px-4"
          />
        }
        aria-label={m['docs.agent_help.header']()}
        title={m['docs.agent_help.header']()}
      >
        <Bot className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">
          {m['docs.agent_help.header']()}
        </span>
      </DialogTrigger>
      <DialogContent
        className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{m['docs.agent_help.title']()}</DialogTitle>
        </DialogHeader>
        <DocsAgentHelp inDialog />
      </DialogContent>
    </Dialog>
  );
}
