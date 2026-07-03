import { createFileRoute } from '@tanstack/react-router';
import { generatorPageHead } from '@/routes/-generator-head';
import { GeneratorPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/ai-video-generator')({
  head: () => generatorPageHead('/ai-video-generator', 'video'),
  component: () => <GeneratorPage mediaType="video" />,
});
