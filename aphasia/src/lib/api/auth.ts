import { api } from './client'
import { setAuthToken, removeAuthToken, MOCK_MODE } from './config'

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    name?: string
    level: number
    score: number
    verifiedL1: boolean
    verifiedL2: boolean
    verifiedL3: boolean
  }
}

export interface User {
  id: string
  email: string
  name?: string
  level: number
  score: number
  verifiedL1: boolean
  verifiedL2: boolean
  verifiedL3: boolean
  createdAt: string
  updatedAt: string
}

// Mock authentication functions
const mockLogin = async (credentials: LoginRequest): Promise<AuthResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Generate a mock token
  const mockToken = `mock_jwt_token_${Date.now()}_${Math.random().toString(36).substring(7)}`
  
  // Create mock user data
  const mockUser: AuthResponse['user'] = {
    id: `user_${credentials.email.replace('@', '_').replace('.', '_')}`,
    email: credentials.email,
    name: credentials.email.split('@')[0],
    level: 1,
    score: 0,
    verifiedL1: true,
    verifiedL2: false,
    verifiedL3: false,
  }
  
  await setAuthToken(mockToken)
  return { token: mockToken, user: mockUser }
}

const mockSignup = async (data: SignupRequest): Promise<AuthResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Generate a mock token
  const mockToken = `mock_jwt_token_${Date.now()}_${Math.random().toString(36).substring(7)}`
  
  // Create mock user data
  const mockUser: AuthResponse['user'] = {
    id: `user_${data.email.replace('@', '_').replace('.', '_')}`,
    email: data.email,
    name: data.name || data.email.split('@')[0],
    level: 1,
    score: 0,
    verifiedL1: true,
    verifiedL2: false,
    verifiedL3: false,
  }
  
  await setAuthToken(mockToken)
  return { token: mockToken, user: mockUser }
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    // Use mock mode if enabled
    if (MOCK_MODE) {
      console.log('🔧 MOCK MODE: Using mock login')
      return mockLogin(credentials)
    }
    
    try {
      const response = await api.post<any>('auth/login', credentials, {
        requireAuth: false,
      })
      
      // Backend now returns consistent format: { token, user }
      // Log response for debugging in dev mode
      if (import.meta.env.DEV) {
        console.log('Login response:', response)
      }
      
      // Check for error responses
      if (response.success === false) {
        const errorMsg = response.error?.message || response.message || 'Login failed'
        throw new Error(errorMsg)
      }
      
      // Extract token and user from response
      // Backend format: { token, user }
      const token = response.token
      const userData = response.user
      
      if (!token) {
        throw new Error('Invalid response: missing token')
      }
      
      if (!userData) {
        throw new Error('Invalid response: missing user data')
      }
      
      await setAuthToken(token)
      return { token, user: userData }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    // Use mock mode if enabled
    if (MOCK_MODE) {
      console.log('🔧 MOCK MODE: Using mock signup')
      return mockSignup(data)
    }
    
    try {
      const response = await api.post<any>('auth/register', data, {
        requireAuth: false,
      })
      
      // Backend now returns consistent format: { token, user }
      // Log response for debugging in dev mode
      if (import.meta.env.DEV) {
        console.log('Signup response:', response)
      }
      
      // Check for error responses
      if (response.success === false) {
        const errorMsg = response.error?.message || response.message || 'Signup failed'
        throw new Error(errorMsg)
      }
      
      // Extract token and user from response
      // Backend format: { token, user }
      const token = response.token
      const userData = response.user
      
      if (!token) {
        throw new Error('Invalid response: missing token')
      }
      
      if (!userData) {
        throw new Error('Invalid response: missing user data')
      }
      
      await setAuthToken(token)
      return { token, user: userData }
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  },

  logout: async (): Promise<void> => {
    await removeAuthToken()
  },

  getCurrentUser: async (): Promise<User> => {
    return api.get<User>('auth/me')
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await api.post<{ token: string }>('auth/refresh', {}, {
      requireAuth: false,
    })
    await setAuthToken(response.token)
    return response
  },

  // Self Protocol verification
  verifyWithSelf: async (proof: any, pubSignals: any, userContextData?: any): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('self/verify', {
        proof,
        pubSignals,
        userContextData,
      }, {
        requireAuth: false,
      })
      
      // Backend now returns consistent format: { token, user }
      const token = response.token
      const userData = response.user
      
      if (!token) {
        throw new Error('Invalid response: missing token')
      }
      
      if (!userData) {
        throw new Error('Invalid response: missing user data')
      }
      
      await setAuthToken(token)
      return { token, user: userData }
    } catch (error: any) {
      // Handle 404 - endpoint not implemented yet
      if (error.status === 404 || error.message?.includes('not found') || error.message?.includes('Route not found')) {
        throw new Error('Self Protocol verification endpoint is not yet implemented on the backend. Please contact the backend team to implement POST /api/v1/self/verify')
      }
      
      // Re-throw other errors
      throw error
    }
  },
}

