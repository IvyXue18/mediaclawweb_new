import { createFileRoute } from '@tanstack/react-router';
import { generatorPageHead } from '@/routes/-generator-head';
import { GeneratorPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/ai-music-generator')({
  head: () => generatorPageHead('/ai-music-generator', 'music'),
  component: () => <GeneratorPage mediaType="music" />,
});
