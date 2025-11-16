import { API_CONFIG } from './config'

export interface HealthCheckResponse {
  status: 'ok' | 'error'
  message?: string
  timestamp?: string
}

export const healthApi = {
  /**
   * Test connection to backend server
   */
  checkConnection: async (): Promise<HealthCheckResponse> => {
    try {
      // Try a simple GET request to test connectivity
      const response = await fetch(`${API_CONFIG.baseURL}/api/${API_CONFIG.apiVersion}/reviews/product/default-product`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        return {
          status: 'ok',
          message: 'Backend server is reachable',
          timestamp: new Date().toISOString(),
        }
      } else {
        return {
          status: 'error',
          message: `Backend responded with status ${response.status}`,
          timestamp: new Date().toISOString(),
        }
      }
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to connect to backend',
        timestamp: new Date().toISOString(),
      }
    }
  },
}

