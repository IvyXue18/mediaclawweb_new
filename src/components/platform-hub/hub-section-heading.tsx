import { cn } from '@/lib/utils';

export function HubSectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={cn(align === 'center' && 'mx-auto max-w-3xl text-center')}>
      <p className="text-primary text-xs font-bold tracking-[0.18em] uppercase">
        {eyebrow}
      </p>
      <h2 className="text-foreground mt-4 text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground mt-5 max-w-3xl text-base leading-7 sm:text-lg sm:leading-8">
          {description}
        </p>
      ) : null}
    </div>
  );
}
