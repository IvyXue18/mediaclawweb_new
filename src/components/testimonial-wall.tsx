import { cn } from '@/lib/utils';

export type TestimonialImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type TestimonialGroup = {
  id: string;
  eyebrow: string;
  title: string;
  testimonials: readonly TestimonialImage[];
};

type TestimonialWallProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  groups: readonly TestimonialGroup[];
  className?: string;
};

export function TestimonialWall({
  id,
  eyebrow,
  title,
  description,
  groups,
  className,
}: TestimonialWallProps) {
  return (
    <section
      id={id}
      className={cn(
        'border-border bg-card text-card-foreground relative overflow-hidden rounded-[2rem] border px-4 py-10 shadow-sm sm:px-6 md:px-8 md:py-12',
        className
      )}
    >
      <div className="bg-primary/10 pointer-events-none absolute -top-28 -left-24 size-72 rounded-full blur-3xl" />
      <div className="bg-accent/70 pointer-events-none absolute -right-24 -bottom-32 size-80 rounded-full blur-3xl" />

      <div className="relative max-w-3xl pb-7">
        <span className="text-primary text-sm font-black tracking-[0.18em]">
          {eyebrow}
        </span>
        <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
          {title}
        </h2>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7 md:text-lg">
          {description}
        </p>
      </div>

      <div className="border-border relative border-t">
        {groups.map((group) => (
          <article
            className="border-border scroll-mt-28 border-b py-8 last:border-b-0 last:pb-0 md:py-9"
            id={group.id}
            key={group.id}
          >
            <div className="mb-5 flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-4">
              <span className="text-primary text-xs font-black tracking-[0.14em]">
                {group.eyebrow}
              </span>
              <h3 className="text-xl font-black tracking-tight md:text-2xl">
                {group.title}
              </h3>
            </div>

            <div
              className={cn(
                'columns-1 gap-3 sm:columns-2',
                group.testimonials.length > 8 ? 'lg:columns-4' : 'lg:columns-3'
              )}
            >
              {group.testimonials.map((testimonial) => (
                <figure
                  className="border-border bg-background hover:border-primary/30 mb-3 break-inside-avoid overflow-hidden rounded-xl border p-1.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  key={testimonial.src}
                >
                  <img
                    src={testimonial.src}
                    alt={testimonial.alt}
                    width={testimonial.width}
                    height={testimonial.height}
                    loading="lazy"
                    className="h-auto w-full rounded-lg"
                  />
                </figure>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
