import { envConfigs } from '@/config';
import {
  baseLocale,
  getLocale,
  locales,
  localizeUrl,
} from '@/paraglide/runtime.js';

type GeneratorMediaType = 'image' | 'music' | 'video';

const GENERATOR_COPY: Record<
  GeneratorMediaType,
  Record<'en' | 'zh', { title: string; description: string }>
> = {
  image: {
    en: {
      title: 'AI Image Generator',
      description:
        "Create image generation tasks with MediaClaw's configured AI provider.",
    },
    zh: {
      title: 'AI 图片生成器',
      description: '使用 MediaClaw 已配置的 AI 服务创建图片生成任务。',
    },
  },
  music: {
    en: {
      title: 'AI Music Generator',
      description:
        "Create music generation tasks with MediaClaw's configured AI provider.",
    },
    zh: {
      title: 'AI 音乐生成器',
      description: '使用 MediaClaw 已配置的 AI 服务创建音乐生成任务。',
    },
  },
  video: {
    en: {
      title: 'AI Video Generator',
      description:
        "Create video generation tasks with MediaClaw's configured AI provider.",
    },
    zh: {
      title: 'AI 视频生成器',
      description: '使用 MediaClaw 已配置的 AI 服务创建视频生成任务。',
    },
  },
};

export function generatorPageHead(path: string, mediaType: GeneratorMediaType) {
  const locale = getLocale();
  const copy =
    GENERATOR_COPY[mediaType][locale as 'en' | 'zh'] ??
    GENERATOR_COPY[mediaType][baseLocale as 'en' | 'zh'];
  const urlFor = (loc: string) =>
    localizeUrl(`${envConfigs.app_url}${path}`, {
      locale: loc as (typeof locales)[number],
    }).href;

  return {
    meta: [
      { title: `${copy.title} | ${envConfigs.app_name}` },
      { name: 'description', content: copy.description },
    ],
    links: [
      { rel: 'canonical', href: urlFor(locale) },
      ...locales.map((loc) => ({
        rel: 'alternate',
        hrefLang: loc,
        href: urlFor(loc),
      })),
      { rel: 'alternate', hrefLang: 'x-default', href: urlFor(baseLocale) },
    ],
  };
}
