/**
 * The single source of truth for testimonial media.
 *
 * Keep this manifest limited to media metadata. Shared labels and descriptions
 * live in the testimonial-wall block so every placement uses the same copy.
 */
export type TestimonialCategory = 'experience' | 'recommendation';

export type TestimonialAsset = {
  src: string;
  width: number;
  height: number;
  category: TestimonialCategory;
  description: string;
};

export const testimonialAssets = [
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/10-great-software.webp',
    width: 834,
    height: 374,
    category: 'experience',
    description: '这个软件真牛',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/17-positive-tool.webp',
    width: 706,
    height: 362,
    category: 'experience',
    description: '太棒了，这个工具很好用',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/18-convenient.webp',
    width: 462,
    height: 246,
    category: 'experience',
    description: '已经成功使用，这个功能很方便',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/02-awesome.webp',
    width: 490,
    height: 254,
    category: 'experience',
    description: '用得好爽，你就是人才',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/19-topic-ready.webp',
    width: 648,
    height: 428,
    category: 'experience',
    description: '总结得很好，新账号选题已经准备好了',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/04-exactly-needed.webp',
    width: 974,
    height: 458,
    category: 'experience',
    description: '很好用，正是我需要的',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/06-easy-config.webp',
    width: 708,
    height: 338,
    category: 'experience',
    description: '使用方便，比以前配置容易很多',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/07-praised-all-morning.webp',
    width: 1418,
    height: 586,
    category: 'experience',
    description: '太好用了，已经夸了一上午',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/20-renewal.webp',
    width: 1444,
    height: 532,
    category: 'experience',
    description: '用起来方便很多，并主动询问续费',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/26-renewed-after-trial.webp',
    width: 734,
    height: 270,
    category: 'experience',
    description: '体验后认可功能并完成续费',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/27-tutorial-feedback.webp',
    width: 720,
    height: 424,
    category: 'experience',
    description: '功能不错，希望继续完善模块教程',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/09-easy-to-use.webp',
    width: 566,
    height: 318,
    category: 'experience',
    description: '真的很好上手',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/21-feedback-detail-a.webp',
    width: 948,
    height: 836,
    category: 'experience',
    description: '内容分析结果很好，马上开始学习',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/22-feedback-detail-b.webp',
    width: 936,
    height: 834,
    category: 'experience',
    description: '采集大量评论并生成完整分析结果',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/23-browser-workflow.webp',
    width: 784,
    height: 738,
    category: 'experience',
    description: '浏览器工作流顺手直观，可以一键完成',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/24-promotion-discussion.webp',
    width: 780,
    height: 420,
    category: 'experience',
    description: '用户讨论产品推广和内容渠道',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/25-additional-feedback.webp',
    width: 594,
    height: 346,
    category: 'experience',
    description: '完成度很高，没想到是独立开发',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/13-agent-solo.webp',
    width: 656,
    height: 332,
    category: 'experience',
    description: 'Agent 可以独立完成任务',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/11-marketing-stable.webp',
    width: 832,
    height: 966,
    category: 'recommendation',
    description: '营销案例引发兴趣且工作流稳定',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/14-user-recommendation.webp',
    width: 766,
    height: 796,
    category: 'recommendation',
    description: '分享营销案例后自然带来传播',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/15-organic-sharing.webp',
    width: 964,
    height: 492,
    category: 'recommendation',
    description: '希望获得代理资格并主动推荐',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/16-friend-referral.webp',
    width: 826,
    height: 556,
    category: 'recommendation',
    description: '主动介绍朋友使用',
  },
  {
    src: 'https://media.mediaclaw.app/testimonials/2026/05-better-workflow.webp',
    width: 984,
    height: 294,
    category: 'recommendation',
    description: '认为产品更好用并希望一起推广',
  },
] as const satisfies readonly TestimonialAsset[];
