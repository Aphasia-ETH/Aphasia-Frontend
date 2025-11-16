// API Configuration
export const API_CONFIG = {
  // Default to localhost, can be overridden via environment or Chrome storage
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  apiVersion: 'v1',
  timeout: 30000, // 30 seconds
}

// Mock mode - set to true to use mock authentication
export const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true' || import.meta.env.VITE_MOCK_MODE === '1'

// Privy Configuration (if needed for frontend)
export const PRIVY_CONFIG = {
  appId: import.meta.env.VITE_PIRVY_API_ID,
  appSecret: import.meta.env.VITE_PIRVY_APP_SECRET,
}

export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${API_CONFIG.baseURL}/api/${API_CONFIG.apiVersion}/${cleanEndpoint}`
}

// Token management
export const getAuthToken = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.storage?.local?.get(['aphasia-token'], (result) => {
      resolve(result['aphasia-token'] || null)
    })
  })
}

export const setAuthToken = async (token: string): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage?.local?.set({ 'aphasia-token': token }, () => {
      resolve()
    })
  })
}

export const removeAuthToken = async (): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage?.local?.remove(['aphasia-token'], () => {
      resolve()
    })
  })
}

