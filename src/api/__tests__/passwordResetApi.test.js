import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../axiosInstance', () => ({
  default: { post: vi.fn() },
}));

import axiosInstance from '../axiosInstance';
import { confirmPasswordReset, requestPasswordReset } from '../authApi';


describe('password reset API', () => {
  beforeEach(() => axiosInstance.post.mockReset().mockResolvedValue({ data: {} }));

  it('requests a reset link by email', () => {
    requestPasswordReset('user@example.com');
    expect(axiosInstance.post).toHaveBeenCalledWith('/auth/password-reset/request', {
      email: 'user@example.com',
    });
  });

  it('confirms a reset with uid, token and matching passwords', () => {
    confirmPasswordReset({
      uid: 'uid-value',
      token: 'token-value',
      password: 'NewPassword!234',
      passwordConfirm: 'NewPassword!234',
    });
    expect(axiosInstance.post).toHaveBeenCalledWith('/auth/password-reset/confirm', {
      uid: 'uid-value',
      token: 'token-value',
      password: 'NewPassword!234',
      password_confirm: 'NewPassword!234',
    });
  });
});
