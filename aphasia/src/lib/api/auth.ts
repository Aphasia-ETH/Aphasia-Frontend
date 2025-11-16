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
      
      // Log full response for debugging
      console.log('Login response:', JSON.stringify(response, null, 2))
      
      // Check if backend endpoint is not implemented
      if (response.data?.message && response.data.message.includes('to be implemented')) {
        throw new Error('Login endpoint is not yet implemented on the backend. Please contact the backend team.')
      }
      if (response.message && response.message.includes('to be implemented')) {
        throw new Error('Login endpoint is not yet implemented on the backend. Please contact the backend team.')
      }
      
      // Handle different response formats
      let token: string | undefined
      let userData: AuthResponse['user'] | undefined
      
      // Try various token field names
      if (response.token) {
        token = response.token
        userData = response.user
      } else if (response.accessToken) {
        token = response.accessToken
        userData = response.user
      } else if (response.authToken) {
        token = response.authToken
        userData = response.user
      } else if (response.jwt) {
        token = response.jwt
        userData = response.user
      } else if (response.data?.token) {
        token = response.data.token
        userData = response.data.user
      } else if (response.data?.accessToken) {
        token = response.data.accessToken
        userData = response.data.user
      } else if (response.data?.authToken) {
        token = response.data.authToken
        userData = response.data.user
      } else if (response.result?.token) {
        token = response.result.token
        userData = response.result.user
      } else if (response.result?.accessToken) {
        token = response.result.accessToken
        userData = response.result.user
      }
      
      // If we have user data but no token, try to extract from user object
      if (!token && userData) {
        if ((userData as any).token) {
          token = (userData as any).token
        }
      }
      
      // If still no token, check if response itself is a token string
      if (!token && typeof response === 'string') {
        token = response
      }
      
      if (!token) {
        console.error('No token found in response. Response structure:', response)
        
        // Check for specific backend messages
        if (response.data?.message) {
          throw new Error(response.data.message)
        }
        if (response.message) {
          throw new Error(response.message)
        }
        
        throw new Error(`Invalid response format: missing token. The backend may not be fully implemented. Response: ${JSON.stringify(response)}`)
      }
      
      // If we don't have user data, create a minimal user object or fetch it
      if (!userData) {
        // Try to extract user info from response
        if (response.user) {
          userData = response.user
        } else if (response.data?.user) {
          userData = response.data.user
        } else if (response.email || response.id) {
          // Create minimal user from response
          userData = {
            id: response.id || response.userId || 'unknown',
            email: response.email || credentials.email,
            name: response.name || response.email?.split('@')[0] || 'User',
            level: response.level || 1,
            score: response.score || 0,
            verifiedL1: response.verifiedL1 ?? false,
            verifiedL2: response.verifiedL2 ?? false,
            verifiedL3: response.verifiedL3 ?? false,
          }
        } else {
          // Fallback: we'll need to fetch user profile
          userData = {
            id: 'unknown',
            email: credentials.email,
            name: credentials.email.split('@')[0],
            level: 1,
            score: 0,
            verifiedL1: false,
            verifiedL2: false,
            verifiedL3: false,
          }
        }
      }
      
      // Ensure userData is defined (TypeScript check)
      if (!userData) {
        userData = {
          id: 'unknown',
          email: credentials.email,
          name: credentials.email.split('@')[0],
          level: 1,
          score: 0,
          verifiedL1: false,
          verifiedL2: false,
          verifiedL3: false,
        }
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
      
      // Log full response for debugging
      console.log('Signup response:', JSON.stringify(response, null, 2))
      
      // Handle 404 or route not found errors
      if ((response as any).status === 404 || (response as any).message?.includes('not found')) {
        throw new Error('Signup endpoint not found. The backend may need to implement POST /api/v1/auth/register')
      }
      
      // Check if backend endpoint is not implemented
      if (response.data?.message && response.data.message.includes('to be implemented')) {
        throw new Error('Signup endpoint is not yet implemented on the backend. Please contact the backend team.')
      }
      if (response.message && response.message.includes('to be implemented')) {
        throw new Error('Signup endpoint is not yet implemented on the backend. Please contact the backend team.')
      }
      
      // Handle different response formats
      let token: string | undefined
      let userData: AuthResponse['user'] | undefined
      
      // Try various token field names
      if (response.token) {
        token = response.token
        userData = response.user
      } else if (response.accessToken) {
        token = response.accessToken
        userData = response.user
      } else if (response.authToken) {
        token = response.authToken
        userData = response.user
      } else if (response.jwt) {
        token = response.jwt
        userData = response.user
      } else if (response.data?.token) {
        token = response.data.token
        userData = response.data.user
      } else if (response.data?.accessToken) {
        token = response.data.accessToken
        userData = response.data.user
      } else if (response.data?.authToken) {
        token = response.data.authToken
        userData = response.data.user
      } else if (response.result?.token) {
        token = response.result.token
        userData = response.result.user
      } else if (response.result?.accessToken) {
        token = response.result.accessToken
        userData = response.result.user
      }
      
      // If we have user data but no token, try to extract from user object
      if (!token && userData) {
        if ((userData as any).token) {
          token = (userData as any).token
        }
      }
      
      // If still no token, check if response itself is a token string
      if (!token && typeof response === 'string') {
        token = response
      }
      
      if (!token) {
        console.error('No token found in response. Response structure:', response)
        
        // Check for specific backend messages
        if (response.data?.message) {
          throw new Error(response.data.message)
        }
        if (response.message) {
          throw new Error(response.message)
        }
        
        throw new Error(`Invalid response format: missing token. The backend may not be fully implemented. Response: ${JSON.stringify(response)}`)
      }
      
      // If we don't have user data, create a minimal user object
      if (!userData) {
        if (response.user) {
          userData = response.user
        } else if (response.data?.user) {
          userData = response.data.user
        } else if (response.email || response.id) {
          // Create minimal user from response
          userData = {
            id: response.id || response.userId || 'unknown',
            email: response.email || data.email,
            name: response.name || data.name || data.email.split('@')[0],
            level: response.level || 1,
            score: response.score || 0,
            verifiedL1: response.verifiedL1 ?? false,
            verifiedL2: response.verifiedL2 ?? false,
            verifiedL3: response.verifiedL3 ?? false,
          }
        } else {
          // Fallback: create minimal user
          userData = {
            id: 'unknown',
            email: data.email,
            name: data.name || data.email.split('@')[0],
            level: 1,
            score: 0,
            verifiedL1: false,
            verifiedL2: false,
            verifiedL3: false,
          }
        }
      }
      
      // Ensure userData is defined (TypeScript check)
      if (!userData) {
        userData = {
          id: 'unknown',
          email: data.email,
          name: data.name || data.email.split('@')[0],
          level: 1,
          score: 0,
          verifiedL1: false,
          verifiedL2: false,
          verifiedL3: false,
        }
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
    const response = await api.post<AuthResponse>('self/verify', {
      proof,
      pubSignals,
      userContextData,
    }, {
      requireAuth: false,
    })
    
    // Handle different response formats
    let token: string
    let userData: AuthResponse['user']
    
    if (response.token) {
      token = response.token
      userData = response.user
    } else if ((response as any).data?.token) {
      token = (response as any).data.token
      userData = (response as any).data.user
    } else {
      throw new Error('Invalid response format: missing token')
    }
    
    await setAuthToken(token)
    return { token, user: userData }
  },
}

