import { apiClient } from './client'
import type { AuthTokens, User } from '@/types'

export const authApi = {
  register: (email: string, password: string): Promise<User> =>
    apiClient.post('/api/v1/auth/register', { email, password }).then((r) => r.data),

  login: (email: string, password: string): Promise<AuthTokens> =>
    apiClient.post('/api/v1/auth/login', { email, password }).then((r) => r.data),

  refresh: (refreshToken: string): Promise<AuthTokens> =>
    apiClient.post('/api/v1/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string): Promise<void> =>
    apiClient.post('/api/v1/auth/logout', { refreshToken }).then(() => undefined),
}
