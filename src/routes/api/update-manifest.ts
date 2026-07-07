import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';

import { pluginOk } from './-plugin-compat';

async function GET({ request }: { request: Request }) {
  const origin = new URL(envConfigs.app_url || request.url).origin;
  const updateManifest = {
    latestVersion: '0.1.9',
    minSupportedVersion: '0.1.0',
    downloadUrl: `${origin}/downloads/mediaclaw.crx`,
    changelogUrl: `${origin}/updates`,
    releases: [
      {
        version: '0.1.9',
        releaseDate: '2026-06-29',
        releaseNotes: [
          {
            tag: '兼容',
            notes: [
              {
                title: '新版官网后端兼容',
                desc: '插件更新检查已可从新版官网 API 获取基础版本清单。',
              },
            ],
          },
        ],
      },
    ],
  };

  return pluginOk(
    {
      ...updateManifest,
      updateManifest,
    },
    'update manifest loaded'
  );
}

export const Route = createFileRoute('/api/update-manifest')({
  server: { handlers: { GET } },
});
