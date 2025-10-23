import Logo from '@/assets/crx.svg'
import { useState } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthModal } from '@/components/AuthModal'
import './App.css'

function AppContent() {
  const [show, setShow] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  
  const toggle = () => setShow(!show)
  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  return (
    <div className="popup-container">
      {show && (
        <div className={`popup-content ${show ? 'opacity-100' : 'opacity-0'}`}>
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Welcome to Aphasia</h1>
            <div className="space-y-2">
              <button 
                onClick={() => openAuthModal('signup')}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Sign Up
              </button>
              <button 
                onClick={() => openAuthModal('login')}
                className="w-full border border-input bg-background px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}
      <button className="toggle-button" onClick={toggle}>
        <img src={Logo} alt="CRXJS logo" className="button-icon" />
      </button>
      
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="aphasia-theme">
      <AppContent />
    </ThemeProvider>
  )
}

export default App
