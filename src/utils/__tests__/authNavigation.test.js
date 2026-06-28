import { describe, it, expect } from 'vitest';
import {
  isProfileComplete,
  isSafeInternalPath,
  resolveAuthedRedirect,
} from '../authNavigation';

const userIncomplete = { is_staff: false, profile: { is_complete: false }, next_path: '/profile' };
const userComplete = { is_staff: false, profile: { is_complete: true }, next_path: '/mypage' };
const userStaff = { is_staff: true, profile: { is_complete: false }, next_path: '/admin/dashboard' };

describe('isProfileComplete', () => {
  it('true only when profile.is_complete', () => {
    expect(isProfileComplete(userComplete)).toBe(true);
    expect(isProfileComplete(userIncomplete)).toBe(false);
    expect(isProfileComplete(null)).toBe(false);
    expect(isProfileComplete({})).toBe(false);
  });
});

describe('isSafeInternalPath', () => {
  it('accepts internal app paths', () => {
    expect(isSafeInternalPath('/mypage')).toBe(true);
    expect(isSafeInternalPath('/report/123')).toBe(true);
  });
  it('rejects open-redirect / loop / non-internal paths', () => {
    expect(isSafeInternalPath('//evil.com')).toBe(false);
    expect(isSafeInternalPath('https://evil.com')).toBe(false);
    expect(isSafeInternalPath('/auth/login')).toBe(false); // 루프 방지
    expect(isSafeInternalPath('/login')).toBe(false);
    expect(isSafeInternalPath('')).toBe(false);
    expect(isSafeInternalPath(null)).toBe(false);
    expect(isSafeInternalPath('javascript:alert(1)')).toBe(false);
  });
});

describe('resolveAuthedRedirect', () => {
  it('staff → next_path (admin)', () => {
    expect(resolveAuthedRedirect(userStaff)).toBe('/admin/dashboard');
  });
  it('incomplete profile → /profile (ignores savedNext)', () => {
    expect(resolveAuthedRedirect(userIncomplete, '/mypage')).toBe('/profile');
  });
  it('complete + safe savedNext → savedNext', () => {
    expect(resolveAuthedRedirect(userComplete, '/report/9')).toBe('/report/9');
  });
  it('complete + unsafe savedNext → next_path', () => {
    expect(resolveAuthedRedirect(userComplete, '//evil.com')).toBe('/mypage');
  });
  it('complete + no savedNext → next_path (/mypage)', () => {
    expect(resolveAuthedRedirect(userComplete)).toBe('/mypage');
  });
  it('no user → /auth/login', () => {
    expect(resolveAuthedRedirect(null)).toBe('/auth/login');
  });
});
