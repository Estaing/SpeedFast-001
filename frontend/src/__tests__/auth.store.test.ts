import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../store/auth'
import type { User } from '../types'

const mockUser: User = { id: 'u1', email: 'test@vinfast.vn', role: 'CUSTOMER' }

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    })
  })

  it('starts unauthenticated', () => {
    const { isAuthenticated, user } = useAuthStore.getState()
    expect(isAuthenticated).toBe(false)
    expect(user).toBeNull()
  })

  it('setTokens authenticates the user and stores all values', () => {
    useAuthStore.getState().setTokens('access-tok', 'refresh-tok', mockUser)
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.email).toBe('test@vinfast.vn')
    expect(state.accessToken).toBe('access-tok')
    expect(state.refreshToken).toBe('refresh-tok')
  })

  it('logout clears all auth state', () => {
    useAuthStore.getState().setTokens('access-tok', 'refresh-tok', mockUser)
    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
  })

  it('stores the user role correctly', () => {
    const adminUser: User = { ...mockUser, role: 'ADMIN' }
    useAuthStore.getState().setTokens('tok', 'ref', adminUser)
    expect(useAuthStore.getState().user?.role).toBe('ADMIN')
  })
})
