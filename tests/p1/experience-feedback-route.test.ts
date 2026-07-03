import { GET, POST } from '@/app/api/rewards/experience-feedback/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUserInfo: vi.fn(),
  getWelfareFeedbackTask: vi.fn(),
}));

vi.mock('@/shared/models/user', () => ({
  getUserInfo: () => mocks.getUserInfo(),
}));

vi.mock('@/shared/models/benefit', () => ({
  getWelfareFeedbackTask: (...args: any[]) =>
    mocks.getWelfareFeedbackTask(...args),
  isMissingBenefitTaskTable: () => false,
}));

describe('/api/rewards/experience-feedback contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUserInfo.mockResolvedValue({ id: 'user-1' });
    mocks.getWelfareFeedbackTask.mockResolvedValue(null);
  });

  it('keeps reward submission plugin-only from the website route', async () => {
    const response = await POST();

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'experience_feedback_plugin_only',
    });
  });

  it('returns the current welfare feedback task for signed-in users', async () => {
    mocks.getWelfareFeedbackTask.mockResolvedValue({
      id: 'feedback-task-1',
      status: 'pending',
    });

    const response = await GET();

    await expect(response.json()).resolves.toMatchObject({
      code: 0,
      data: {
        feedbackTask: {
          id: 'feedback-task-1',
          status: 'pending',
        },
      },
    });
    expect(mocks.getWelfareFeedbackTask).toHaveBeenCalledWith('user-1');
  });

  it('rejects website reward access when the user is not signed in', async () => {
    mocks.getUserInfo.mockResolvedValue(null);

    const response = await GET();

    await expect(response.json()).resolves.toMatchObject({
      code: -1,
      message: 'no auth, please sign in',
    });
  });
});
