import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';

import { HubSectionHeading } from './hub-section-heading';
import type { PlatformHubFaq } from './types';

export function HubFaq({
  heading,
  faqs,
}: {
  heading: { eyebrow: string; title: string };
  faqs: PlatformHubFaq[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="border-border/60 border-t py-20 sm:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <HubSectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          align="center"
        />
        <div className="mx-auto mt-12 max-w-3xl space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <article
                key={faq.question}
                className={cn(
                  'border-border/60 bg-card overflow-hidden rounded-2xl border transition-colors duration-300',
                  isOpen &&
                    'border-primary/30 bg-card shadow-primary/5 shadow-lg'
                )}
              >
                <h3 className="m-0 text-base font-bold">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpenIndex((current) =>
                        current === index ? null : index
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-foreground text-base leading-snug font-bold">
                      {faq.question}
                    </span>
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                        isOpen
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isOpen ? (
                        <Minus className="size-4" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                    </span>
                  </button>
                </h3>

                {isOpen ? (
                  <div className="px-6 pb-5">
                    <p className="border-border/30 text-muted-foreground border-t pt-4 text-sm leading-7">
                      {faq.answer}
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
