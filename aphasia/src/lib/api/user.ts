import { api } from './client'
import { User } from './auth'
import { MOCK_MODE } from './config'

export interface UpdateUserRequest {
  name?: string
  email?: string
}

export interface UserStats {
  totalReviews: number
  level: number
  score: number
  achievements: string[]
}

// Mock user profile functions
const mockGetProfile = async (): Promise<User> => {
  // Get user from Chrome storage (set during login/signup)
  return new Promise((resolve) => {
    chrome.storage?.local?.get(['aphasia-user'], (result) => {
      if (result['aphasia-user']) {
        const user = result['aphasia-user']
        resolve({
          ...user,
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: user.updatedAt || new Date().toISOString(),
        })
      } else {
        // Fallback mock user
        resolve({
          id: 'mock_user_1',
          email: 'user@example.com',
          name: 'Mock User',
          level: 1,
          score: 0,
          verifiedL1: true,
          verifiedL2: false,
          verifiedL3: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    })
  })
}

const mockUpdateProfile = async (data: UpdateUserRequest): Promise<User> => {
  // Get current user and update
  const currentUser = await mockGetProfile()
  const updatedUser: User = {
    ...currentUser,
    ...data,
    updatedAt: new Date().toISOString(),
  }
  
  // Save to storage
  chrome.storage?.local?.set({ 'aphasia-user': updatedUser })
  return updatedUser
}

const mockGetStats = async (): Promise<UserStats> => {
  const user = await mockGetProfile()
  return {
    totalReviews: 0,
    level: user.level,
    score: user.score,
    achievements: [],
  }
}

export const userApi = {
  getProfile: async (): Promise<User> => {
    if (MOCK_MODE) {
      console.log('🔧 MOCK MODE: Using mock getProfile')
      return mockGetProfile()
    }
    return api.get<User>('user/profile')
  },

  updateProfile: async (data: UpdateUserRequest): Promise<User> => {
    if (MOCK_MODE) {
      console.log('🔧 MOCK MODE: Using mock updateProfile')
      return mockUpdateProfile(data)
    }
    return api.patch<User>('user/profile', data)
  },

  getStats: async (): Promise<UserStats> => {
    if (MOCK_MODE) {
      console.log('🔧 MOCK MODE: Using mock getStats')
      return mockGetStats()
    }
    return api.get<UserStats>('user/stats')
  },
}

