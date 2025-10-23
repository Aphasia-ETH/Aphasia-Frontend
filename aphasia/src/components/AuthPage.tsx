import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthModal } from '@/components/AuthModal'

export function AuthPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  
  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-2xl">A</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Aphasia</h1>
            <p className="text-muted-foreground mt-2">Your AI-powered communication assistant</p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Welcome!</h2>
          <p className="text-muted-foreground">
            Get started with Aphasia to enhance your communication experience.
          </p>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => openAuthModal('signup')}
            className="w-full"
            size="lg"
          >
            Get Started - Sign Up
          </Button>
          <Button 
            onClick={() => openAuthModal('login')}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Already have an account? Log In
          </Button>
        </div>

        {/* Features Preview */}
        <Card>
          <CardHeader>
            <CardTitle>What you'll get:</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                AI-powered text assistance
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Voice-to-text capabilities
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Smart suggestions and corrections
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Seamless browser integration
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            By using Aphasia, you agree to our{' '}
            <Button variant="link" className="p-0 h-auto text-xs">Terms of Service</Button>
            {' '}and{' '}
            <Button variant="link" className="p-0 h-auto text-xs">Privacy Policy</Button>
          </p>
        </div>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  )
}
