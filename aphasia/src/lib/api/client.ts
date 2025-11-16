import { getApiUrl, getAuthToken, API_CONFIG } from './config'

export interface ApiError {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

export class ApiClientError extends Error {
  status?: number
  errors?: Record<string, string[]>

  constructor(message: string, status?: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.errors = errors
  }
}

interface RequestOptions extends RequestInit {
  requireAuth?: boolean
}

export const apiClient = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { requireAuth = true, headers = {}, ...fetchOptions } = options

  // Build headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  }

  // Add auth token if required
  if (requireAuth) {
    const token = await getAuthToken()
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }
  }

  // Build URL
  const url = getApiUrl(endpoint)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    })

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')

    let data: any
    if (isJson) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    // Handle errors
    if (!response.ok) {
      // Extract error message - handle various formats
      let errorMessage: string
      if (typeof data === 'string') {
        errorMessage = data
      } else if (data?.error?.message && typeof data.error.message === 'string') {
        // Handle nested error structure: {error: {message: "..."}}
        errorMessage = data.error.message
      } else if (data?.message && typeof data.message === 'string') {
        errorMessage = data.message
      } else if (data?.error && typeof data.error === 'string') {
        errorMessage = data.error
      } else if (typeof data === 'object' && data !== null) {
        // If it's an object, try to stringify it nicely
        errorMessage = JSON.stringify(data)
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }
      
      // Special handling for 404 (route not found)
      if (response.status === 404) {
        // If we have a specific error message, use it; otherwise use generic message
        if (errorMessage && !errorMessage.includes('Route not found')) {
          errorMessage = `Route not found: ${errorMessage}`
        } else {
          errorMessage = `Route not found: ${url}. The backend endpoint may not be implemented yet.`
        }
      }
      
      console.error(`API Error [${response.status}]:`, {
        url,
        status: response.status,
        error: errorMessage,
        data
      })
      throw new ApiClientError(
        errorMessage,
        response.status,
        data?.errors
      )
    }

    // Log successful requests in development
    if (import.meta.env.DEV) {
      console.log(`API Success [${response.status}]:`, { url, data })
    }

    return data as T
  } catch (error) {
    // Enhanced error logging
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Check for localhost permission errors
    if (errorMessage.includes('localhost') || errorMessage.includes('Failed to fetch') || errorMessage.includes('net::ERR_FAILED')) {
      const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1')
      if (isLocalhost) {
        throw new ApiClientError(
          `Localhost access denied. Please ensure:
1. Extension has been reloaded after manifest changes
2. Backend server is running on ${API_CONFIG.baseURL}
3. Backend CORS allows Chrome extension origins
4. Check Chrome extension permissions in chrome://extensions`,
          0,
          undefined
        )
      }
    }
    
    console.error('API Request Failed:', {
      url,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    if (error instanceof ApiClientError) {
      throw error
    }

    // Network or other errors - provide more helpful error messages
    let userMessage = errorMessage
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      userMessage = `Unable to connect to ${API_CONFIG.baseURL}. Please check:
- Backend server is running
- CORS is configured correctly
- Network connection is active`
    }
    
    throw new ApiClientError(userMessage, 0)
  }
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
}

