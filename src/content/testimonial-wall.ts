import type { TestimonialGroup } from '@/components/testimonial-wall';

export const testimonialGroups = [
  {
    id: 'product-feedback',
    eyebrow: '使用体验',
    title: '用过之后，他们这样说',
    testimonials: [
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/10-great-software.webp',
        alt: '使用评价：这个软件真牛',
        width: 834,
        height: 374,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/17-positive-tool.webp',
        alt: '使用评价：太棒了，这个工具很好用',
        width: 706,
        height: 362,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/18-convenient.webp',
        alt: '使用评价：已经成功使用，这个功能很方便',
        width: 462,
        height: 246,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/02-awesome.webp',
        alt: '使用评价：用得好爽，你就是人才',
        width: 490,
        height: 254,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/19-topic-ready.webp',
        alt: '使用评价：总结得很好，新账号选题已经准备好了',
        width: 648,
        height: 428,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/04-exactly-needed.webp',
        alt: '使用评价：很好用，正是我需要的',
        width: 974,
        height: 458,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/06-easy-config.webp',
        alt: '使用评价：使用方便，比以前配置容易很多',
        width: 708,
        height: 338,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/07-praised-all-morning.webp',
        alt: '使用评价：太好用了，已经夸了一上午',
        width: 1418,
        height: 586,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/20-renewal.webp',
        alt: '使用评价：用起来方便很多，并主动询问续费',
        width: 1444,
        height: 532,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/26-renewed-after-trial.webp',
        alt: '使用评价：体验后认可功能并完成续费',
        width: 734,
        height: 270,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/27-tutorial-feedback.webp',
        alt: '使用评价：功能不错，希望继续完善模块教程',
        width: 720,
        height: 424,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/09-easy-to-use.webp',
        alt: '使用评价：真的很好上手',
        width: 566,
        height: 318,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/21-feedback-detail-a.webp',
        alt: '使用评价：内容分析结果很好，马上开始学习',
        width: 948,
        height: 836,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/22-feedback-detail-b.webp',
        alt: '使用评价：采集大量评论并生成完整分析结果',
        width: 936,
        height: 834,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/23-browser-workflow.webp',
        alt: '使用评价：浏览器工作流顺手直观，可以一键完成',
        width: 784,
        height: 738,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/24-promotion-discussion.webp',
        alt: '使用评价：用户讨论产品推广和内容渠道',
        width: 780,
        height: 420,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/25-additional-feedback.webp',
        alt: '使用评价：完成度很高，没想到是独立开发',
        width: 594,
        height: 346,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/13-agent-solo.webp',
        alt: '使用评价：Agent 可以独立完成任务',
        width: 656,
        height: 332,
      },
    ],
  },
  {
    id: 'organic-recommendations',
    eyebrow: '主动推荐',
    title: '觉得好用，也愿意分享给别人',
    testimonials: [
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/11-marketing-stable.webp',
        alt: '用户自发推荐：营销案例引发兴趣且工作流稳定',
        width: 832,
        height: 966,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/14-user-recommendation.webp',
        alt: '用户自发推荐：分享营销案例后自然带来传播',
        width: 766,
        height: 796,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/15-organic-sharing.webp',
        alt: '用户自发推荐：希望获得代理资格并主动推荐',
        width: 964,
        height: 492,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/16-friend-referral.webp',
        alt: '用户自发推荐：主动介绍朋友使用',
        width: 826,
        height: 556,
      },
      {
        src: 'https://media.mediaclaw.app/testimonials/2026/05-better-workflow.webp',
        alt: '用户自发推荐：认为产品更好用并希望一起推广',
        width: 984,
        height: 294,
      },
    ],
  },
] as const satisfies readonly TestimonialGroup[];
