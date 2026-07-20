import { and, eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { accountStyleProfile } from '@/config/db/schema';

const MAX_REPRESENTATIVE_SAMPLES = 12;

type JsonRecord = Record<string, unknown>;

export type AccountStyleSampleTier =
  | 'high_engagement'
  | 'recent'
  | 'typical'
  | 'low_engagement';

export type AccountStyleSample = {
  id: string;
  title: string;
  content: string;
  transcript: string;
  analysis: string;
  noteType: string;
  sourceUrl: string;
  coverUrl: string;
  publishTime: string;
  likes: number;
  comments: number;
  collects: number;
  tier: AccountStyleSampleTier;
};

export type AccountStyleReportDetail = {
  id: string;
  platform: string;
  bloggerName: string;
  bloggerUrl: string;
  avatarUrl: string;
  sampleCount: number;
  detailSampleCount: number;
  lastAnalyzedAt: string;
  report: {
    summary: string;
    positioning: string;
    contentPillars: string[];
    titlePatterns: string[];
    titleKeywords: string[];
    bodyTone: string;
    bodyStructure: string;
    bodyPhrases: string[];
    scriptHook: string;
    scriptRhythm: string;
    coverText: string;
    doList: string[];
    avoidList: string[];
  };
  samples: AccountStyleSample[];
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseRecord(value: string | null | undefined): JsonRecord {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function record(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function text(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function number(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function stringList(value: unknown, limit = 12) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (!isRecord(item)) return '';
      return text(item.rule, item.pattern, item.title, item.value);
    })
    .filter(Boolean)
    .slice(0, limit);
}

/**
 * Report media is deliberately strict: the API never sends original JPG/PNG
 * scrape assets to the detail page. The ingestion pipeline should persist a
 * compact WebP derivative and reference that URL as avatar/coverWebpUrl.
 */
export function compactWebpUrl(value: unknown) {
  const candidate = text(value);
  if (!candidate || candidate.length > 2048) return '';
  try {
    const url = new URL(candidate, 'https://local.mediaclaw.invalid');
    return url.pathname.toLowerCase().endsWith('.webp') ? candidate : '';
  } catch {
    return '';
  }
}

function normalizeTier(source: JsonRecord): AccountStyleSampleTier {
  const tags = [
    text(source.tier, source.layer, source.category),
    ...stringList(source.sampleTags || source.tags),
  ]
    .join(' ')
    .toLowerCase();

  if (/low|control|contrast|\u4f4e\u4e92\u52a8|\u5bf9\u7167/.test(tags))
    return 'low_engagement';
  if (/recent|latest|\u6700\u8fd1|\u6700\u65b0/.test(tags)) return 'recent';
  if (/high|viral|top|\u9ad8\u4e92\u52a8|\u7206\u6b3e/.test(tags))
    return 'high_engagement';
  return 'typical';
}

function normalizeSample(
  value: unknown,
  profileId: string,
  index: number
): AccountStyleSample | null {
  if (typeof value === 'string') {
    const title = value.trim();
    if (!title) return null;
    return {
      id: `${profileId}-sample-${index}`,
      title,
      content: '',
      transcript: '',
      analysis: '',
      noteType: '',
      sourceUrl: '',
      coverUrl: '',
      publishTime: '',
      likes: 0,
      comments: 0,
      collects: 0,
      tier: 'typical',
    };
  }
  if (!isRecord(value)) return null;

  const item = value;
  const title = text(item.title, item.noteTitle, item.name);
  const content = text(item.content, item.desc, item.description, item.body);
  const transcript = text(
    item.transcriptText,
    item.videoTranscriptText,
    item.transcript,
    item.script
  );
  const analysisValue =
    item.analysisResult || item.noteAnalysis || item.analysis;
  const analysis = text(
    analysisValue,
    isRecord(analysisValue) ? JSON.stringify(analysisValue, null, 2) : ''
  );
  if (!title && !content && !transcript && !analysis) return null;

  return {
    id:
      text(item.id, item.sampleId, item.noteId) ||
      `${profileId}-sample-${index}`,
    title: title || `Sample ${index + 1}`,
    content,
    transcript,
    analysis,
    noteType: text(item.noteType, item.type),
    sourceUrl: text(item.noteUrl, item.sourceUrl, item.url),
    coverUrl: compactWebpUrl(
      item.coverWebpUrl || item.storedCoverUrl || item.coverUrl
    ),
    publishTime: text(item.publishTime, item.publishDate, item.publishedAt),
    likes: number(item.likes),
    comments: number(item.comments),
    collects: number(item.collects || item.favorites),
    tier: normalizeTier(item),
  };
}

function sampleCandidates(summary: JsonRecord) {
  const layers = record(summary.sampleLayers || summary.layers);
  const layered = Object.entries(layers).flatMap(([tier, values]) =>
    Array.isArray(values)
      ? values.map((value) =>
          isRecord(value) ? { ...value, tier: value.tier || tier } : value
        )
      : []
  );
  if (layered.length) return layered;

  const direct =
    summary.representativeSamples ||
    summary.selectedSamples ||
    summary.evidenceSamples ||
    summary.samples ||
    summary.sampleItems;
  if (Array.isArray(direct)) return direct;
  return Array.isArray(summary.sampleTitles) ? summary.sampleTitles : [];
}

function normalizeReport(profile: JsonRecord) {
  const titleStyle = record(profile.titleStyle);
  const bodyStyle = record(profile.bodyStyle);
  const scriptStyle = record(profile.scriptStyle);
  const visualTextStyle = record(profile.visualTextStyle);
  const structureRules = record(profile.structureRules);
  const languageStyle = record(profile.languageStyle);

  return {
    summary: text(profile.summary, profile.accountSummary),
    positioning: text(
      profile.positioning,
      record(profile.coreIdentity).positioning
    ),
    contentPillars: stringList(profile.contentPillars || profile.topicRules),
    titlePatterns: stringList(titleStyle.patterns || profile.titleRules),
    titleKeywords: stringList(titleStyle.keywords),
    bodyTone: text(bodyStyle.tone, languageStyle.tone),
    bodyStructure: text(
      bodyStyle.structure,
      stringList(structureRules.body).join(' \u2192 ')
    ),
    bodyPhrases: stringList(bodyStyle.phrases || languageStyle.phrases),
    scriptHook: text(
      scriptStyle.hook,
      stringList(languageStyle.openingPatterns).join(' / ')
    ),
    scriptRhythm: text(scriptStyle.rhythm, languageStyle.rhythm),
    coverText: text(visualTextStyle.coverText),
    doList: stringList(profile.doList || profile.learnableRules),
    avoidList: stringList(profile.avoidList || profile.avoidRules),
  };
}

export async function getAccountStyleReportDetail(input: {
  id: string;
  userId: string;
}): Promise<AccountStyleReportDetail | null> {
  const [row] = await db()
    .select({
      id: accountStyleProfile.id,
      platform: accountStyleProfile.platform,
      bloggerName: accountStyleProfile.bloggerName,
      bloggerUrl: accountStyleProfile.bloggerUrl,
      sampleCount: accountStyleProfile.sampleCount,
      detailSampleCount: accountStyleProfile.detailSampleCount,
      profileJson: accountStyleProfile.profileJson,
      editableJson: accountStyleProfile.editableJson,
      sampleSummaryJson: accountStyleProfile.sampleSummaryJson,
      lastAnalyzedAt: accountStyleProfile.lastAnalyzedAt,
    })
    .from(accountStyleProfile)
    .where(
      and(
        eq(accountStyleProfile.id, input.id),
        eq(accountStyleProfile.userId, input.userId)
      )
    )
    .limit(1);

  if (!row) return null;

  const profileJson = parseRecord(row.profileJson);
  const editableJson = parseRecord(row.editableJson);
  const summary = parseRecord(row.sampleSummaryJson);
  const profile = Object.keys(editableJson).length ? editableJson : profileJson;
  const sourceAccount = record(profile.sourceAccount);
  const samples = sampleCandidates(summary)
    .map((sample, index) => normalizeSample(sample, row.id, index))
    .filter((sample): sample is AccountStyleSample => Boolean(sample))
    .slice(0, MAX_REPRESENTATIVE_SAMPLES);

  return {
    id: row.id,
    platform: row.platform,
    bloggerName: row.bloggerName || '',
    bloggerUrl: row.bloggerUrl || '',
    avatarUrl: compactWebpUrl(
      summary.avatarWebpUrl ||
        summary.accountAvatarUrl ||
        sourceAccount.avatarWebpUrl ||
        sourceAccount.avatarUrl
    ),
    sampleCount: row.sampleCount,
    detailSampleCount: row.detailSampleCount,
    lastAnalyzedAt: row.lastAnalyzedAt.toISOString(),
    report: normalizeReport(profile),
    samples,
  };
}
