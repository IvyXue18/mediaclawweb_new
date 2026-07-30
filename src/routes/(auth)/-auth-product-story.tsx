import { useEffect, useState } from 'react';

import { m } from '@/paraglide/messages.js';

import styles from './-auth-product-story.module.css';

type Scene = 'collect' | 'analyze' | 'draft';

const sceneOrder: Scene[] = ['collect', 'analyze', 'draft'];

export function AuthProductStory() {
  const [scene, setScene] = useState<Scene>('collect');
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReducedMotion(true);
      setScene('draft');
    }
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;

    const timer = window.setTimeout(() => {
      setScene((current) => {
        const currentIndex = sceneOrder.indexOf(current);
        return sceneOrder[(currentIndex + 1) % sceneOrder.length];
      });
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [paused, reducedMotion, scene]);

  return (
    <aside
      className={styles.story}
      data-scene={scene}
      aria-label={m['common.sign.story.aria_label']()}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <div
        className={`${styles.scene} ${scene === 'collect' ? styles.active : ''}`}
        aria-hidden={scene !== 'collect'}
      >
        <StoryCopy
          eyebrow={m['common.sign.story.collect.eyebrow']()}
          title={
            <>
              {m['common.sign.story.collect.title_1']()}
              <br />
              <em>{m['common.sign.story.collect.title_2']()}</em>
            </>
          }
          description={m['common.sign.story.collect.description']()}
        />
        <div className={`${styles.stage} ${styles.collectStage}`}>
          <BrowserWindow
            className={styles.warehouse}
            title="MediaClaw 内容数据库"
          >
            <img
              src="/imgs/auth-story/feishu-dashboard.webp"
              alt="同步到飞书的数据面板和内容表格"
              loading="eager"
            />
          </BrowserWindow>
          <div className={styles.extension}>
            <img
              src="/imgs/auth-story/extension-panel.webp"
              alt="MediaClaw 浏览器插件采集面板"
              loading="eager"
            />
          </div>
          <Badge className={styles.collectBadge}>
            <strong>✓</strong>
            {m['common.sign.story.collect.badge']()}
          </Badge>
          <div className={styles.dataRail}>
            {[
              m['common.sign.story.collect.field_body'](),
              m['common.sign.story.collect.field_engagement'](),
              m['common.sign.story.collect.field_comments'](),
              m['common.sign.story.collect.field_script'](),
            ].map((item) => (
              <span key={item}>↓ {item}</span>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`${styles.scene} ${scene === 'analyze' ? styles.active : ''}`}
        aria-hidden={scene !== 'analyze'}
      >
        <StoryCopy
          eyebrow={m['common.sign.story.analyze.eyebrow']()}
          title={
            <>
              {m['common.sign.story.analyze.title_1']()}
              <br />
              <em>{m['common.sign.story.analyze.title_2']()}</em>
            </>
          }
          description={m['common.sign.story.analyze.description']()}
        />
        <div className={`${styles.stage} ${styles.analyzeStage}`}>
          <div className={styles.accountReport}>
            <img
              src="/imgs/auth-story/account-report.webp"
              alt="账号定位与内容结构拆解报告"
            />
          </div>
          <div className={styles.topicLibrary}>
            <img
              src="/imgs/auth-story/topics-output.webp"
              alt="从账号规律推演出的完整选题卡"
            />
          </div>
          <Badge className={styles.analyzeBadge}>
            <strong>AI</strong>
            {m['common.sign.story.analyze.badge']()}
          </Badge>
          <Badge className={styles.topicBadge}>
            <strong>12</strong>
            {m['common.sign.story.analyze.topic_count']()}
          </Badge>
        </div>
      </div>

      <div
        className={`${styles.scene} ${scene === 'draft' ? styles.active : ''}`}
        aria-hidden={scene !== 'draft'}
      >
        <StoryCopy
          eyebrow={m['common.sign.story.draft.eyebrow']()}
          title={
            <>
              {m['common.sign.story.draft.title_1']()}
              <br />
              <em>{m['common.sign.story.draft.title_2']()}</em>
            </>
          }
          description={m['common.sign.story.draft.description']()}
        />
        <div className={`${styles.stage} ${styles.draftStage}`}>
          <div className={styles.topicCard}>
            <img
              src="/imgs/auth-story/topic-card.webp"
              alt="可直接进入创作的完整选题卡"
            />
          </div>
          <span className={styles.flowArrow}>→</span>
          <BrowserWindow
            className={styles.draftResult}
            title="MediaClaw 内容创作"
          >
            <img
              src="/imgs/auth-story/draft-result.webp"
              alt="由选题生成的完整可编辑初稿"
            />
          </BrowserWindow>
          <Badge className={styles.draftBadge}>
            <strong>✓ 8/8</strong>
            {m['common.sign.story.draft.badge']()}
          </Badge>
          <div className={styles.deliveryRail}>
            <strong>{m['common.sign.story.draft.delivered']()}</strong>
            <span>{m['common.sign.story.draft.deliverables']()}</span>
          </div>
        </div>
      </div>

      <nav className={styles.timeline} aria-label="Product workflow">
        {sceneOrder.map((item, index) => (
          <button
            key={item}
            type="button"
            className={scene === item ? styles.current : ''}
            onClick={() => setScene(item)}
            aria-current={scene === item ? 'step' : undefined}
          >
            <i />
            <span>
              {index + 1}. {m[`common.sign.story.nav.${item}`]()}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function StoryCopy({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
}) {
  return (
    <div className={styles.copy}>
      <span className={styles.eyebrow}>
        <i />
        {eyebrow}
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function BrowserWindow({
  className,
  title,
  children,
}: {
  className: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.browser} ${className}`}>
      <div className={styles.browserBar}>
        <span />
        <span />
        <span />
        <b>{title}</b>
      </div>
      <div className={styles.browserContent}>{children}</div>
    </div>
  );
}

function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return <div className={`${styles.badge} ${className}`}>{children}</div>;
}
