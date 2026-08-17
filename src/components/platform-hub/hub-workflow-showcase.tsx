import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import { recordAnalyticsEventSafe } from '@/lib/client-analytics';
import { cn } from '@/lib/utils';

import { HubIcon } from './hub-icon';
import { HubSectionHeading } from './hub-section-heading';
import type { PlatformHubContent, PlatformHubWorkflow } from './types';

export function HubWorkflowShowcase({
  heading,
  workflows,
  platform,
}: {
  heading: {
    eyebrow: string;
    title: string;
    description: string;
    stepLabel: string;
  };
  workflows: PlatformHubWorkflow[];
  platform: PlatformHubContent['platformSlug'];
}) {
  const [activeId, setActiveId] = useState(workflows[0]?.id ?? '');

  return (
    <section className="bg-muted/35 border-border/60 border-y py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <HubSectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          description={heading.description}
          align="center"
        />

        <div className="border-border/70 bg-background mx-auto mt-11 grid max-w-4xl grid-cols-2 gap-2 rounded-2xl border p-2 shadow-sm lg:grid-cols-4">
          {workflows.map((workflow, index) => (
            <button
              key={workflow.id}
              type="button"
              onClick={() => {
                setActiveId(workflow.id);
                recordAnalyticsEventSafe('hub_workflow_tab', {
                  platform,
                  workflow: workflow.id,
                });
              }}
              className={cn(
                'flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all sm:px-4',
                activeId === workflow.id
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span className="text-[11px] opacity-60">0{index + 1}</span>
              <span>{workflow.label}</span>
              {workflow.statusLabel ? (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[9px] leading-none font-bold',
                    activeId === workflow.id
                      ? 'bg-background/15'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  {workflow.statusLabel}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {workflows.map((workflow) => (
          <article
            key={workflow.id}
            className={cn(
              'border-border/70 bg-card mt-8 overflow-hidden rounded-[2rem] border shadow-sm lg:grid-cols-[0.85fr_1.15fr]',
              activeId === workflow.id ? 'grid' : 'hidden'
            )}
          >
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="text-primary text-xs font-bold tracking-[0.15em] uppercase">
                {workflow.label}
              </p>
              {workflow.statusLabel ? (
                <span className="bg-primary/10 text-primary mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase">
                  {workflow.statusLabel}
                </span>
              ) : null}
              <h3 className="text-foreground mt-3 text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-4xl">
                {workflow.title}
              </h3>
              <p className="text-muted-foreground mt-5 text-base leading-7">
                {workflow.description}
              </p>
              <ol className="mt-8 space-y-4">
                {workflow.steps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <CheckCircle2 className="text-primary mt-0.5 size-5 shrink-0" />
                    <div>
                      <span className="text-muted-foreground text-xs font-semibold uppercase">
                        {heading.stepLabel} {index + 1}
                      </span>
                      <p className="text-foreground mt-0.5 text-sm leading-6 font-medium">
                        {step}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-slate-950 p-5 sm:p-8 lg:min-h-[560px]">
              {workflow.image ? (
                <div className="flex h-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-5">
                  <img
                    src={workflow.image.src}
                    alt={workflow.image.alt}
                    width={workflow.image.width}
                    height={workflow.image.height}
                    loading="lazy"
                    decoding="async"
                    className="mx-auto max-h-[500px] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                  />
                </div>
              ) : (
                <div className="relative flex h-full min-h-[420px] flex-col justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-9">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(244,114,182,0.18),transparent_42%)]" />
                  <div className="relative mx-auto flex max-w-md flex-col items-center">
                    <div className="flex size-16 items-center justify-center rounded-2xl border border-pink-300/25 bg-pink-300/10 text-pink-300 shadow-2xl shadow-pink-500/10">
                      <HubIcon name="bot" className="size-7" />
                    </div>
                    {workflow.statusLabel ? (
                      <span className="mt-4 rounded-full border border-pink-300/20 bg-pink-300/10 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-pink-200 uppercase">
                        {workflow.statusLabel}
                      </span>
                    ) : null}
                    <div className="mt-8 grid w-full gap-3">
                      {workflow.steps.map((step, index) => (
                        <div
                          key={step}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-5 text-slate-200"
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[10px] font-bold text-pink-200">
                            0{index + 1}
                          </span>
                          <span className="line-clamp-2 flex-1">{step}</span>
                          {index < workflow.steps.length - 1 ? (
                            <ArrowRight className="size-4 shrink-0 text-slate-600" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
