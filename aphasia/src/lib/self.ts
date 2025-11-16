import { SelfAppBuilder } from '@selfxyz/qrcode'
import { API_CONFIG } from './api/config'

export interface SelfAppConfig {
  appName: string
  scope: string
  endpoint: string
  userId: string
  disclosures?: {
    minimumAge?: number
    nationality?: boolean
    ofac?: boolean
    excludedCountries?: string[]
  }
}

export interface SelfVerificationResult {
  isValid: boolean
  attestationId?: number
  pubSignals?: any
  userContextData?: any
  error?: string
}

/**
 * Create a Self Protocol app instance for identity verification
 */
export function createSelfApp(config: SelfAppConfig) {
  const disclosures = config.disclosures || {
    minimumAge: 18,
    nationality: true,
    ofac: true,
  }
  
  const builder = new SelfAppBuilder({
    appName: config.appName,
    scope: config.scope,
    endpoint: config.endpoint,
    userId: config.userId,
    disclosures: disclosures as any, // Type assertion for Self SDK
  })

  return builder.build()
}

/**
 * Default Self app configuration for Aphasia
 */
export function getDefaultSelfConfig(userId: string): SelfAppConfig {
  return {
    appName: 'Aphasia',
    scope: 'aphasia-identity-verification',
    endpoint: `${API_CONFIG.baseURL}/api/${API_CONFIG.apiVersion}/self/verify`,
    userId,
    disclosures: {
      minimumAge: 18,
      nationality: true,
      ofac: true, // Check against OFAC sanctions list
      excludedCountries: ['IRN', 'PRK'], // Exclude Iran and North Korea
    },
  }
}

