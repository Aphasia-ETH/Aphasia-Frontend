import { useState, useEffect, useRef } from 'react'
import { SelfQRcodeWrapper } from '@selfxyz/qrcode'
import { createSelfApp, getDefaultSelfConfig, SelfVerificationResult } from '@/lib/self'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Scan } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/lib/api/config'

interface SelfVerificationProps {
  userId: string
  onSuccess: (result: SelfVerificationResult) => void
  onError?: (error: Error) => void
  onCancel?: () => void
}

export function SelfVerification({ userId, onSuccess, onError, onCancel }: SelfVerificationProps) {
  const [selfApp, setSelfApp] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    try {
      const config = getDefaultSelfConfig(userId)
      const app = createSelfApp(config)
      setSelfApp(app)
    } catch (error) {
      console.error('Failed to create Self app:', error)
      if (onError) {
        onError(error as Error)
      }
    }

    // Cleanup polling on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [userId, onError])

  const handleSuccess = () => {
    // onSuccess is called when QR code is scanned - verification happens on backend
    setIsVerifying(true)
    toast.info('QR code scanned', {
      description: 'Please complete verification in the Self app. Waiting for backend confirmation...',
    })
    
    // Start polling backend for verification result
    // The mobile app sends proof directly to backend endpoint
    startPollingForVerification()
  }

  const startPollingForVerification = async () => {
    const maxAttempts = 60 // 60 seconds max (verification can take time)
    let attempts = 0
    
    // Use a session ID or timestamp to identify this verification session
    const sessionId = `self-${userId}-${Date.now()}`
    
    pollIntervalRef.current = setInterval(async () => {
      attempts++
      
      try {
        // Poll the backend to check if verification completed
        // Backend receives proof from mobile app and should return token
        const response = await fetch(
          `${API_CONFIG.baseURL}/api/${API_CONFIG.apiVersion}/self/status?userId=${encodeURIComponent(userId)}&sessionId=${sessionId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          
          // Backend returns { verified: true, token: "...", user: {...} } when complete
          if (data.verified && data.token) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            
            setIsVerifying(false)
            
            // Verification complete - pass token and user data
            const verificationResult: SelfVerificationResult = {
              isValid: true,
              attestationId: data.attestationId,
              pubSignals: data.pubSignals,
              userContextData: { ...data.user, token: data.token },
            }
            
            onSuccess(verificationResult)
          } else if (data.error) {
            // Backend returned an error
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            
            setIsVerifying(false)
            const error = new Error(data.error || 'Verification failed')
            if (onError) {
              onError(error)
            }
          }
        } else if (response.status === 404) {
          // Status endpoint not found - backend might not have this endpoint yet
          // This is expected if backend hasn't implemented status polling
          // We'll continue polling in case backend implements it
          console.log('Status endpoint not found, continuing to poll...')
        }
      } catch (error) {
        console.error('Polling error:', error)
        // Don't stop polling on network errors - might be temporary
      }
      
      if (attempts >= maxAttempts) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        
        setIsVerifying(false)
        toast.error('Verification timeout', {
          description: 'The verification took too long. Please try scanning the QR code again.',
        })
        
        if (onError) {
          onError(new Error('Verification timeout'))
        }
      }
    }, 2000) // Poll every 2 seconds
  }

  const handleError = (error: any) => {
    console.error('Self verification error:', error)
    const errorMessage = error?.message || 'Verification failed. Please try again.'
    
    toast.error('Verification failed', {
      description: errorMessage,
    })
    
    if (onError) {
      onError(error as Error)
    }
  }


  if (!selfApp) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Verify Your Identity
        </CardTitle>
        <CardDescription>
          Scan the QR code with the Self mobile app to verify your identity using your passport.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          {isVerifying && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for verification to complete...</span>
            </div>
          )}
          <SelfQRcodeWrapper
            selfApp={selfApp}
            onSuccess={handleSuccess}
            onError={handleError}
            type="websocket"
          />
          
          <div className="text-sm text-muted-foreground text-center space-y-2">
            <p>1. Open the Self mobile app</p>
            <p>2. Tap "Scan QR Code"</p>
            <p>3. Point your camera at this QR code</p>
            <p>4. Follow the prompts to verify your passport</p>
          </div>
        </div>

        {onCancel && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={isVerifying}
          >
            Cancel
          </Button>
        )}

        <div className="text-xs text-muted-foreground text-center pt-2">
          <p>Your identity is verified using zero-knowledge proofs.</p>
          <p>We never see your personal information.</p>
        </div>
      </CardContent>
    </Card>
  )
}

