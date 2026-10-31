import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearUser();
  });

  it('initializes with hydrated state', () => {
    const state = useAuthStore.getState();
    expect(state.isHydrated).toBe(true);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('sets user and token via setAuth', () => {
    const mockUser = { _id: '123', email: 'test@example.com', role: 'admin' };
    useAuthStore.getState().setAuth(mockUser, 'test-token');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe('test-token');
    expect(state.isHydrated).toBe(true);
  });

  it('clears credentials on clearUser', () => {
    useAuthStore.getState().setAuth({ _id: '123' }, 'test-token');
    useAuthStore.getState().clearUser();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});

