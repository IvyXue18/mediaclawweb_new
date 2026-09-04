import { m } from '@/paraglide/messages.js';
import {
  TestimonialWall,
  type TestimonialGroup,
} from '@/components/testimonial-wall';
import { testimonialAssets } from '@/content/testimonial-wall';

const groupDefinitions = [
  {
    id: 'product-feedback',
    category: 'experience',
    eyebrow: () => m['testimonials.group.experience.eyebrow'](),
    title: () => m['testimonials.group.experience.title'](),
  },
  {
    id: 'organic-recommendations',
    category: 'recommendation',
    eyebrow: () => m['testimonials.group.recommendation.eyebrow'](),
    title: () => m['testimonials.group.recommendation.title'](),
  },
] as const;

export function getTestimonialGroups(): readonly TestimonialGroup[] {
  return groupDefinitions.map((definition) => ({
    id: definition.id,
    eyebrow: definition.eyebrow(),
    title: definition.title(),
    testimonials: testimonialAssets
      .filter((asset) => asset.category === definition.category)
      .map(({ category: _category, description, ...asset }) => ({
        ...asset,
        alt: description,
      })),
  }));
}

export function TestimonialWallSection({
  id,
  className,
}: {
  id?: string;
  className?: string;
}) {
  return (
    <TestimonialWall
      id={id}
      className={className}
      eyebrow={m['testimonials.wall.eyebrow']()}
      title={m['testimonials.wall.title']()}
      description={m['testimonials.wall.description']()}
      groups={getTestimonialGroups()}
    />
  );
}
