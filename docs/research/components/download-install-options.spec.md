# Download Install Options Specification

## Overview

- Target file: `src/blocks/legacy-dynamic-page.tsx`
- Source reference: old repo `src/themes/immersive/blocks/download.tsx`
- Interaction model: click-driven tabs. The market tab is visible by default; clicking the package tab reveals the offline package card, security card, manual install steps, install FAQ cards, and tutorial link.

## DOM Structure

- `#download` section renders the legacy page heading and the new-user onboarding guide.
- The section uses the old download-block skeleton: prominent heading, wide spacing, overflow-hidden container, and a subtle grid background layer.
- Step `01 安装插件` embeds `DownloadInstallOptions`.
- Desktop renders a sticky 3-step side navigation; mobile renders a sticky 3-column compact step nav.
- Each onboarding step is a bordered card with current/next status copy and arrow connectors between steps.
- `DownloadInstallOptions` contains:
  - Two tab triggers: market install and package install.
  - Market tab grid with store install cards.
  - Package tab with:
    - package download card area
    - security commitment card
    - manual install steps panel
    - FAQ card panel
    - tutorial video/help link

## Source Styles

Styles are restored from the old Tailwind structure rather than a generic FAQ fallback:

- Tabs list: `bg-muted/50`, rounded-xl, two columns, active trigger background + shadow.
- Store cards: translucent card surface, primary-tinted icon well, checklist rows, full-width primary CTA, hover lift/shadow.
- Package layout: `md:grid-cols-2 lg:grid-cols-5`, with a `lg:col-span-3` package card column and `lg:col-span-2` security card.
- Security card: primary-tinted border/background with centered shield icon.
- Manual steps: rounded border panel, two-column grid on desktop.
- FAQ panel: card-like bordered panel, FAQ cards in `md:grid-cols-3`.
- Tutorial link: primary-tinted pill button with play icon and hover inversion.

## Text Content

Uses verbatim JSON from `src/content/legacy-pages/zh/download.json`:

- `商店安装 (推荐)`
- `离线安装 (安装包)`
- `安全承诺`
- `如何手动安装离线包?`
- `安装常见问题`
- `查看安装及使用教程`

## Responsive Behavior

- Desktop: package tab uses 5-column distribution, FAQ cards render in 3 columns.
- Tablet: package card/security card collapse to 2 columns.
- Mobile: tabs remain two columns, package content stacks naturally, FAQ cards become a single column, and the compact step nav stays usable without horizontal document overflow.

## Regression Hooks

- `data-download-section`
- `data-download-heading`
- `data-download-onboarding-guide`
- `data-download-step-nav`
- `data-download-mobile-step-nav`
- `data-download-step-card`
- `data-download-step-connector`
- `data-download-install-tabs`
- `data-download-package-tab`
- `data-download-market-grid`
- `data-download-store-card`
- `data-download-package-card`
- `data-download-card-button`
- `data-download-package-panel`
- `data-download-security-card`
- `data-download-manual-steps`
- `data-download-faq-grid`
- `data-download-video-link`
