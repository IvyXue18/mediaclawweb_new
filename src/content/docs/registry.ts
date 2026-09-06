// Content registry for the /docs information architecture.
// Single source of truth for sidebar structure, breadcrumbs, and prev/next —
// see docs/docs-site-information-architecture-plan.md section 2.1 / 3.
// Page prose (title/description/body) lives in the matching MDX file under
// src/content/docs/**; this file only owns navigation structure.

export type DocPageType = 'guide' | 'method' | 'path' | 'mapping' | 'index';

export interface DocLeafDef {
  kind: 'page';
  slug: string;
  navTitle: string;
  pageType: DocPageType;
  /** Date of the latest substantial editorial review. Keep this accurate:
   * it is emitted as sitemap lastmod and structured-data dateModified. */
  updatedAt: string;
  /** Lucide icon name, only rendered when the leaf sits directly under a
   * group (i.e. it's a top-level "chapter" row) — see doc-nav-list.tsx. */
  icon?: string;
}

export interface DocLinkDef {
  kind: 'link';
  navTitle: string;
  href: string;
  icon?: string;
}

export type DocNavEntry = DocLeafDef | DocLinkDef;

export interface DocSubgroupDef {
  id: string;
  label: string;
  step: number;
  icon?: string;
  items: DocLeafDef[];
}

export interface DocGroupDef {
  id: string;
  label: string;
  items?: DocNavEntry[];
  subgroups?: DocSubgroupDef[];
}

function page(
  slug: string,
  navTitle: string,
  pageType: DocPageType,
  icon?: string,
  updatedAt = DOCS_PUBLISHED_AT
): DocLeafDef {
  return { kind: 'page', slug, navTitle, pageType, icon, updatedAt };
}

function link(navTitle: string, href: string, icon?: string): DocLinkDef {
  return { kind: 'link', navTitle, href, icon };
}

// The current documentation set was completed and reviewed together for the
// initial public launch. Future material changes should pass a page-specific
// updatedAt as the fifth argument to page().
export const DOCS_PUBLISHED_AT = '2026-09-06';

export const docGroups: DocGroupDef[] = [
  {
    id: 'getting-started',
    label: '快速开始',
    items: [
      link('总览', '/docs', 'House'),
      page('getting-started/install', '安装与登录', 'guide', 'LogIn'),
      page('getting-started/core-interface', '熟悉核心界面', 'guide', 'Table2'),
      page('getting-started/first-draft', '10 分钟从采集到初稿', 'path', 'Zap'),
    ],
  },
  {
    id: 'collect-sync',
    label: '采集与同步',
    items: [page('collect/no-watermark', '下载图片/视频', 'guide', 'Archive')],
    subgroups: [
      {
        id: 'collect-content',
        label: '采集数据和内容',
        step: 1,
        icon: 'Database',
        items: [
          page('collect/single-post', '单篇爆款', 'guide'),
          page('collect/account-posts', '账号主页作品', 'guide'),
          page('collect/search-results', '关键词搜索作品', 'guide'),
          page('collect/douyin-collection', '抖音合集', 'guide'),
          page('collect/comments', '作品评论', 'guide'),
        ],
      },
      {
        id: 'extract-copy',
        label: '图片/视频转文案',
        step: 2,
        icon: 'PenTool',
        items: [
          page('collect/transcript', '视频转文字：提取逐字稿', 'guide'),
          page('collect/image-text', '图片转文字：提取图片文案', 'guide'),
        ],
      },
      {
        id: 'export-sync',
        label: '数据导出与同步',
        step: 3,
        icon: 'Send',
        items: [
          page('collect/export-local', '导出到本地', 'guide'),
          page('collect/feishu-sync', '同步到飞书多维表格', 'guide'),
        ],
      },
    ],
  },
  {
    id: 'content-workflow',
    label: '内容研究与创作',
    subgroups: [
      {
        id: 'benchmark',
        label: '监控和拆解账号',
        step: 1,
        icon: 'Target',
        items: [
          page('benchmark/find-accounts', '爆款作品反推对标账号', 'guide'),
          page('benchmark/monitoring', '持续监控账号', 'guide'),
          page('benchmark/account-research', '拆解对标账号', 'guide'),
        ],
      },
      {
        id: 'viral-research',
        label: '寻找和拆解爆款作品',
        step: 2,
        icon: 'Flame',
        items: [
          page('viral-research/account-hits', '找某个账号的爆款', 'guide'),
          page('viral-research/keyword-hits', '按关键词找爆款', 'guide'),
          page(
            'viral-research/low-follower-viral',
            '找关键词低粉爆款',
            'guide'
          ),
          page(
            'viral-research/single-post-breakdown',
            '拆解一篇爆款作品',
            'guide'
          ),
        ],
      },
      {
        id: 'topics',
        label: '持续有选题可做',
        step: 3,
        icon: 'Layers',
        items: [
          page('topics/keyword-trends', '从关键词看选题趋势', 'guide'),
          page('topics/longtail-demand', '有自然搜索量的选题', 'guide'),
          page('topics/comment-ideas', '从评论中发现选题', 'guide'),
          page('topics/viral-expansion', '从爆款笔记扩展选题', 'guide'),
          page('topics/account-directions', '从对标账号找选题', 'guide'),
        ],
      },
      {
        id: 'create',
        label: '内容创作',
        step: 4,
        icon: 'PenTool',
        items: [
          page('create/overview', '三条创作途径怎么选', 'path'),
          page('create/plugin-workbench', '在 AI 工作台创作', 'guide'),
          page('create/feishu-batch', '同步飞书批量分析和创作', 'guide'),
          page('create/agent-creation', '用 Agent 结合知识库创作', 'guide'),
        ],
      },
    ],
  },
  {
    id: 'brand',
    label: '舆情与获客',
    items: [
      page('brand/sentiment', '品牌与竞品舆情', 'guide', 'Search'),
      page('brand/high-intent', '筛选高意向客资', 'guide', 'Filter'),
      page('brand/handoff', '自动私信触达', 'method', 'Send'),
    ],
  },
  {
    id: 'agent-workflow',
    label: 'Agent 工作流',
    items: [
      page('agent/overview', 'Agent 能做什么', 'guide', 'Sparkles'),
      page('agent/setup', '安装、配对与升级', 'guide', 'LogIn'),
      page('agent/prompt-examples', '任务案例', 'method', 'MessageCircle'),
      page('agent/knowledge-base', '连接你的知识库', 'method', 'Archive'),
    ],
  },
  {
    id: 'settings-help',
    label: '设置与帮助',
    items: [
      page('settings/plugin', '插件配置', 'guide', 'Wrench'),
      page('settings/feishu-template', '飞书模板配置', 'guide', 'Send'),
      page('settings/faq', '常见问题', 'guide', 'HelpCircle'),
      link('更新日志', '/updates', 'History'),
    ],
  },
];

function flattenLeaves(): DocLeafDef[] {
  const leaves: DocLeafDef[] = [];
  for (const group of docGroups) {
    if (group.items) {
      for (const entry of group.items) {
        if (entry.kind === 'page') leaves.push(entry);
      }
    }
    if (group.subgroups) {
      for (const subgroup of group.subgroups) {
        leaves.push(...subgroup.items);
      }
    }
  }
  return leaves;
}

const allLeaves = flattenLeaves();

export function findDocLeaf(slug: string): DocLeafDef | undefined {
  return allLeaves.find((leaf) => leaf.slug === slug);
}

export function getAllDocSlugs(): string[] {
  return allLeaves.map((leaf) => leaf.slug);
}

export interface DocBreadcrumbItem {
  label: string;
  href?: string;
}

// Root-level "reading chains" used for prev/next — see the plan's note that
// reference pages are lookup material, not part of a guided reading order.
function readingChains(): DocLeafDef[][] {
  const chains: DocLeafDef[][] = [];
  for (const group of docGroups) {
    if (group.id === 'settings-help') continue;
    if (group.items) {
      const leaves = group.items.filter(
        (entry): entry is DocLeafDef => entry.kind === 'page'
      );
      if (leaves.length) chains.push(leaves);
    }
    if (group.subgroups) {
      chains.push(group.subgroups.flatMap((subgroup) => subgroup.items));
    }
  }
  return chains;
}

export function getBreadcrumbTrail(slug: string): DocBreadcrumbItem[] {
  const trail: DocBreadcrumbItem[] = [{ label: '文档首页', href: '/docs' }];
  for (const group of docGroups) {
    if (group.items) {
      const leaf = group.items.find(
        (entry): entry is DocLeafDef =>
          entry.kind === 'page' && entry.slug === slug
      );
      if (leaf) {
        trail.push({ label: group.label });
        trail.push({ label: leaf.navTitle });
        return trail;
      }
    }
    if (group.subgroups) {
      for (const subgroup of group.subgroups) {
        const leaf = subgroup.items.find((item) => item.slug === slug);
        if (leaf) {
          trail.push({ label: group.label });
          trail.push({ label: subgroup.label });
          trail.push({ label: leaf.navTitle });
          return trail;
        }
      }
    }
  }
  return trail;
}

export interface DocPrevNext {
  prev?: { navTitle: string; slug: string };
  next?: { navTitle: string; slug: string };
}

export function getPrevNext(slug: string): DocPrevNext {
  for (const chain of readingChains()) {
    const index = chain.findIndex((leaf) => leaf.slug === slug);
    if (index === -1) continue;
    return {
      prev: chain[index - 1]
        ? { navTitle: chain[index - 1].navTitle, slug: chain[index - 1].slug }
        : undefined,
      next: chain[index + 1]
        ? { navTitle: chain[index + 1].navTitle, slug: chain[index + 1].slug }
        : undefined,
    };
  }
  return {};
}

export function findActiveSubgroupId(slug: string): string | undefined {
  for (const group of docGroups) {
    if (!group.subgroups) continue;
    const subgroup = group.subgroups.find((sg) =>
      sg.items.some((item) => item.slug === slug)
    );
    if (subgroup) return subgroup.id;
  }
  return undefined;
}

export interface DocIndexEntry {
  navTitle: string;
  slug: string;
  pageType: DocPageType;
}

export interface DocIndexSection {
  label: string;
  entries: DocIndexEntry[];
}

// Flat cross-reference for the "全部功能索引" page — links only, no
// duplicated tutorial prose (plan section 2, [索引]).
export function getIndexSections(): DocIndexSection[] {
  const sections: DocIndexSection[] = [];
  for (const group of docGroups) {
    if (group.items) {
      const entries = group.items
        .filter((entry): entry is DocLeafDef => entry.kind === 'page')
        .map((leaf) => ({
          navTitle: leaf.navTitle,
          slug: leaf.slug,
          pageType: leaf.pageType,
        }));
      if (entries.length) sections.push({ label: group.label, entries });
    }
    if (group.subgroups) {
      for (const subgroup of group.subgroups) {
        sections.push({
          label: subgroup.label,
          entries: subgroup.items.map((leaf) => ({
            navTitle: leaf.navTitle,
            slug: leaf.slug,
            pageType: leaf.pageType,
          })),
        });
      }
    }
  }
  return sections;
}

export const pageTypeLabels: Record<DocPageType, string> = {
  guide: '正文',
  method: '方法',
  path: '串联',
  mapping: '映射',
  index: '索引',
};
