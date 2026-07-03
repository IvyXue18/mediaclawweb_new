import { GET } from '@/routes/api/admin/rewards';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  hasPermission: vi.fn(),
  listChannelSurveyResponses: vi.fn(),
  listExperienceFeedbackResponses: vi.fn(),
  listBenefitRewardLedgers: vi.fn(),
}));

vi.mock('@/core/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: (...args: any[]) => mocks.getSession(...args),
    },
  }),
}));

vi.mock('@/modules/rbac/service', () => ({
  hasPermission: (...args: any[]) => mocks.hasPermission(...args),
}));

vi.mock('@/modules/benefits/service', () => ({
  listChannelSurveyResponses: (...args: any[]) =>
    mocks.listChannelSurveyResponses(...args),
  listExperienceFeedbackResponses: (...args: any[]) =>
    mocks.listExperienceFeedbackResponses(...args),
  listBenefitRewardLedgers: (...args: any[]) =>
    mocks.listBenefitRewardLedgers(...args),
}));

function buildRequest(query = '') {
  return new Request(`https://mediaclaw.example/api/admin/rewards${query}`);
}

describe('admin rewards route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@example.com' },
    });
    mocks.hasPermission.mockResolvedValue(true);
    mocks.listChannelSurveyResponses.mockResolvedValue({
      items: [{ id: 'survey-1', source: 'xiaohongshu' }],
      total: 1,
    });
    mocks.listExperienceFeedbackResponses.mockResolvedValue({
      items: [{ id: 'feedback-1', rating: 5 }],
      total: 1,
    });
    mocks.listBenefitRewardLedgers.mockResolvedValue({
      items: [{ id: 'ledger-1', status: 'completed' }],
      total: 1,
    });
  });

  it('lists channel survey rewards with old admin filters', async () => {
    const response = await GET({
      request: buildRequest(
        '?kind=channel-survey&page=2&pageSize=20&source=xiaohongshu&search=ACT'
      ),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        items: [{ id: 'survey-1', source: 'xiaohongshu' }],
        total: 1,
      },
    });
    expect(mocks.listChannelSurveyResponses).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
      source: 'xiaohongshu',
      credentialCode: null,
      search: 'ACT',
    });
  });

  it('lists experience feedback rewards with rating filtering', async () => {
    const response = await GET({
      request: buildRequest('?kind=experience-feedback&rating=5&search=copy'),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        items: [{ id: 'feedback-1', rating: 5 }],
        total: 1,
      },
    });
    expect(mocks.listExperienceFeedbackResponses).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      rating: 5,
      credentialCode: null,
      search: 'copy',
    });
  });

  it('lists reward ledger rows with task and status filtering', async () => {
    const response = await GET({
      request: buildRequest(
        '?kind=ledger&taskType=channel_survey&status=completed&credentialCode=ACT'
      ),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        items: [{ id: 'ledger-1', status: 'completed' }],
        total: 1,
      },
    });
    expect(mocks.listBenefitRewardLedgers).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      taskType: 'channel_survey',
      status: 'completed',
      credentialCode: 'ACT',
      search: null,
    });
  });

  it('rejects non-admin reward access', async () => {
    mocks.hasPermission.mockResolvedValue(false);

    const response = await GET({
      request: buildRequest('?kind=ledger'),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'Forbidden',
    });
    expect(mocks.listBenefitRewardLedgers).not.toHaveBeenCalled();
  });
});
