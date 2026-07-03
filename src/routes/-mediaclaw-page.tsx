import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';

type MediaClawPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  items: Array<{
    title: string;
    description: string;
  }>;
  steps?: Array<{
    label: string;
    title: string;
    description: string;
  }>;
  metrics?: Array<{
    value: string;
    label: string;
  }>;
  children?: ReactNode;
};

export function MediaClawPage({
  eyebrow,
  title,
  description,
  primaryHref,
  primaryLabel,
  items,
  steps,
  metrics,
  children,
}: MediaClawPageProps) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-24">
            <div className="max-w-3xl">
              <p className="text-primary text-sm font-medium">{eyebrow}</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-6xl">
                {title}
              </h1>
              <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8">
                {description}
              </p>
              {primaryHref && primaryLabel ? (
                <Link
                  href={primaryHref}
                  className={cn(
                    'bg-primary text-primary-foreground hover:bg-primary/90 mt-8 inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-medium transition-colors'
                  )}
                >
                  {primaryLabel}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
            <div className="bg-muted/40 border-border grid content-start gap-4 rounded-lg border p-5">
              {items.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <CheckCircle2
                    className="text-primary mt-0.5 size-5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="text-sm font-medium">{item.title}</h2>
                    <p className="text-muted-foreground mt-1 text-sm leading-6">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        {steps?.length ? (
          <section className="border-b">
            <div className="mx-auto w-full max-w-6xl px-6 py-16">
              <div className="grid gap-4 md:grid-cols-3">
                {steps.map((step) => (
                  <div
                    key={step.label}
                    className="border-border bg-card rounded-lg border p-5"
                  >
                    <p className="text-primary text-xs font-medium">
                      {step.label}
                    </p>
                    <h2 className="mt-3 text-lg font-semibold">{step.title}</h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
        {metrics?.length ? (
          <section className="border-b">
            <div className="mx-auto grid w-full max-w-6xl gap-4 px-6 py-12 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label}>
                  <p className="text-3xl font-semibold">{metric.value}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {children}
      </main>
      <Footer />
    </div>
  );
}
