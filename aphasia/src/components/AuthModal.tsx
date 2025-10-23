import { useState } from 'react'
import { SignupForm } from './SignupForm'
import { LoginForm } from './LoginForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'signup'
}

export function AuthModal({ isOpen, onClose, initialMode = 'signup' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)

  if (!isOpen) return null

  const handleSwitchToLogin = () => setMode('login')
  const handleSwitchToSignup = () => setMode('signup')

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full">
        {mode === 'signup' ? (
          <SignupForm
            onSwitchToLogin={handleSwitchToLogin}
            onClose={onClose}
          />
        ) : (
          <LoginForm
            onSwitchToSignup={handleSwitchToSignup}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}
