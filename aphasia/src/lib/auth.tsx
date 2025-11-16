import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, userApi, ApiClientError } from '@/lib/api'

interface User {
  id: string
  email: string
  name?: string
  level: number
  score: number
  verifiedL1: boolean
  verifiedL2: boolean
  verifiedL3: boolean
  createdAt?: string
  updatedAt?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  verifyWithSelf: (proof: any, pubSignals: any, userContextData?: any) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if we have auth token
        chrome.storage?.local?.get(['aphasia-token', 'aphasia-user'], async (result) => {
          if (result['aphasia-token'] && result['aphasia-user']) {
            // We have token and cached user, verify it's still valid
            try {
              const currentUser = await userApi.getProfile()
              setUser({
                id: currentUser.id,
                email: currentUser.email,
                name: currentUser.name,
                level: currentUser.level,
                score: currentUser.score,
                verifiedL1: currentUser.verifiedL1,
                verifiedL2: currentUser.verifiedL2,
                verifiedL3: currentUser.verifiedL3,
                createdAt: currentUser.createdAt,
                updatedAt: currentUser.updatedAt,
              })
              // Update storage
              chrome.storage.local.set({ 'aphasia-user': currentUser })
            } catch (error) {
              // Token might be invalid, clear everything
              console.error('Failed to verify token:', error)
              chrome.storage.local.remove(['aphasia-token', 'aphasia-user', 'aphasia-auth'])
              setUser(null)
            }
          } else {
            setUser(null)
          }
          setIsLoading(false)
        })
      } catch (error) {
        console.error('Failed to load user:', error)
        setUser(null)
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password })
      
      // Save user data with timestamps for mock mode compatibility
      const now = new Date().toISOString()
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        level: response.user.level,
        score: response.user.score,
        verifiedL1: response.user.verifiedL1,
        verifiedL2: response.user.verifiedL2,
        verifiedL3: response.user.verifiedL3,
        createdAt: now,
        updatedAt: now,
      }
      
      setUser(userData)
      
      // Save to storage
      chrome.storage?.local?.set({
        'aphasia-user': userData,
        'aphasia-auth': true,
      })
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const signup = async (email: string, password: string, name?: string) => {
    try {
      const response = await authApi.signup({ 
        email, 
        password, 
        name: name || email.split('@')[0] 
      })
      
      // Save user data with timestamps for mock mode compatibility
      const now = new Date().toISOString()
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        level: response.user.level,
        score: response.user.score,
        verifiedL1: response.user.verifiedL1,
        verifiedL2: response.user.verifiedL2,
        verifiedL3: response.user.verifiedL3,
        createdAt: now,
        updatedAt: now,
      }
      
      setUser(userData)
      
      // Save to storage
      chrome.storage?.local?.set({
        'aphasia-user': userData,
        'aphasia-auth': true,
      })
    } catch (error) {
      console.error('Signup failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
      setUser(null)
      
      // Clear storage
      chrome.storage?.local?.remove(['aphasia-token', 'aphasia-user', 'aphasia-auth'])
    } catch (error) {
      console.error('Logout failed:', error)
      // Clear local state anyway
      setUser(null)
      chrome.storage?.local?.remove(['aphasia-token', 'aphasia-user', 'aphasia-auth'])
    }
  }

  const verifyWithSelf = async (proof: any, pubSignals: any, userContextData?: any) => {
    try {
      const response = await authApi.verifyWithSelf(proof, pubSignals, userContextData)
      
      // Save user data
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        level: response.user.level,
        score: response.user.score,
        verifiedL1: response.user.verifiedL1,
        verifiedL2: response.user.verifiedL2,
        verifiedL3: response.user.verifiedL3,
      }
      
      setUser(userData)
      
      // Save to storage
      chrome.storage?.local?.set({
        'aphasia-user': userData,
        'aphasia-auth': true,
      })
    } catch (error) {
      console.error('Self verification failed:', error)
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      const currentUser = await userApi.getProfile()
      const userData: User = {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        level: currentUser.level,
        score: currentUser.score,
        verifiedL1: currentUser.verifiedL1,
        verifiedL2: currentUser.verifiedL2,
        verifiedL3: currentUser.verifiedL3,
        createdAt: currentUser.createdAt,
        updatedAt: currentUser.updatedAt,
      }
      setUser(userData)
      chrome.storage?.local?.set({ 'aphasia-user': userData })
    } catch (error) {
      console.error('Failed to refresh user:', error)
      // If refresh fails, user might be logged out
      if (error instanceof ApiClientError && error.status === 401) {
        await logout()
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        verifyWithSelf,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

