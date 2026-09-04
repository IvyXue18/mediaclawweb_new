import { ArrowRight, Download, MessageSquareQuote } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { TestimonialWallSection } from '@/blocks/testimonial-wall';
import { buttonVariants } from '@/components/ui/button';

export function CustomerReviews() {
  return (
    <>
      <section className="relative overflow-hidden px-4 pt-36 pb-14 sm:px-6 md:pt-44 md:pb-20">
        <div className="bg-primary/10 pointer-events-none absolute top-8 left-1/2 size-[28rem] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold">
            <MessageSquareQuote className="size-4" aria-hidden="true" />
            {m['customers.hero.eyebrow']()}
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-balance sm:text-5xl md:text-6xl">
            {m['customers.hero.title']()}
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-3xl text-lg leading-8 text-balance md:text-xl">
            {m['customers.hero.description']()}
          </p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 md:pb-28">
        <div className="mx-auto max-w-7xl">
          <TestimonialWallSection />

          <div className="border-primary/20 from-primary/10 via-card to-accent/50 mt-8 overflow-hidden rounded-[2rem] border bg-gradient-to-br px-6 py-10 sm:px-10 md:flex md:items-center md:justify-between md:gap-10 md:py-12">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                {m['customers.cta.title']()}
              </h2>
              <p className="text-muted-foreground mt-3 text-base leading-7 md:text-lg">
                {m['customers.cta.description']()}
              </p>
            </div>
            <div className="mt-6 flex shrink-0 flex-wrap gap-3 md:mt-0">
              <Link
                href="/download"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'rounded-full px-6 font-bold'
                )}
              >
                <Download className="size-4" aria-hidden="true" />
                {m['customers.cta.download']()}
              </Link>
              <Link
                href="/pricing"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'bg-background/70 rounded-full px-6 font-bold'
                )}
              >
                {m['customers.cta.pricing']()}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
