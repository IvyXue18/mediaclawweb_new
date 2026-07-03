import { createFileRoute } from '@tanstack/react-router';
import { generatorPageHead } from '@/routes/-generator-head';
import { GeneratorPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/ai-image-generator')({
  head: () => generatorPageHead('/ai-image-generator', 'image'),
  component: () => <GeneratorPage mediaType="image" />,
});
