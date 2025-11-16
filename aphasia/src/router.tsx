import { ThemeProvider } from '@/components/theme-provider'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { SignupForm } from '@/components/SignupForm'
import { LoginForm } from '@/components/LoginForm'
import { Reviews } from '@/components/Reviews'
import { Settings } from '@/components/Settings'
import { Toaster } from '@/components/ui/sonner'
import { ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '@/lib/auth'

// Simple routing state management
type Route = 'home' | 'signup' | 'login' | 'settings'

// Layout component for all routes
function RootLayout({ children, showThemeToggle = true, showBackButton = false, onBack, isAuthPage = false }: { 
  children: React.ReactNode
  showThemeToggle?: boolean
  showBackButton?: boolean
  onBack?: () => void
  isAuthPage?: boolean
}) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="aphasia-theme">
      <div className={`w-full h-full min-h-[600px] ${isAuthPage ? 'flex flex-col' : 'flex items-center justify-center'} ${isAuthPage ? 'p-4' : 'p-4'} relative overflow-hidden`}>
        {/* Theme Toggle - only show on home page */}
        {showThemeToggle && (
          <div className="absolute top-4 right-4 z-10">
            <ModeToggle />
          </div>
        )}
        
        {/* Back Button - show on all pages except home */}
        {showBackButton && onBack && (
          <div className="absolute top-4 left-4 z-50">
            <Button
              onClick={onBack}
              variant="ghost"
              size="icon"
              className="h-9 w-9 transition-all hover:scale-110 bg-background/80 backdrop-blur-sm border shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className={`w-full h-full ${isAuthPage ? 'flex-1 flex flex-col justify-start pt-16' : 'max-w-md'}`}>
          {children}
        </div>
        <Toaster position="top-center" richColors />
      </div>
    </ThemeProvider>
  )
}

// Home page component
function HomePage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return <Reviews onNavigate={onNavigate} />
}

// Settings page component
function SettingsPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <Settings onBack={() => onNavigate('home')} />
  )
}

// Signup page component
function SignupPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <RootLayout showThemeToggle={false} showBackButton={true} onBack={() => onNavigate('home')} isAuthPage={true}>
      <SignupForm 
        onSwitchToLogin={() => onNavigate('login')}
      />
    </RootLayout>
  )
}

// Login page component
function LoginPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <RootLayout showThemeToggle={false} showBackButton={true} onBack={() => onNavigate('home')} isAuthPage={true}>
      <LoginForm 
        onSwitchToSignup={() => onNavigate('signup')}
      />
    </RootLayout>
  )
}

// Main App component with simple routing
function AppContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [currentRoute, setCurrentRoute] = useState<Route>('home')
  const [isLoading, setIsLoading] = useState(true)

  // Load saved route from storage
  useEffect(() => {
    chrome.storage?.local?.get(['aphasia-route'], (result) => {
      if (result['aphasia-route']) {
        setCurrentRoute(result['aphasia-route'] as Route)
      }
      setIsLoading(false)
    })
  }, [])

  // Redirect to login if not authenticated (except on auth pages)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      if (currentRoute !== 'login' && currentRoute !== 'signup') {
        setCurrentRoute('login')
      }
    } else if (!authLoading && isAuthenticated) {
      // If authenticated and on login/signup, go to home
      if (currentRoute === 'login' || currentRoute === 'signup') {
        setCurrentRoute('home')
      }
    }
  }, [isAuthenticated, authLoading, currentRoute])

  const handleNavigate = (route: Route) => {
    setCurrentRoute(route)
    // Save route to storage
    chrome.storage?.local?.set({ 'aphasia-route': route })
  }

  const renderCurrentRoute = () => {
    if (isLoading || authLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    // Show login/signup if not authenticated
    if (!isAuthenticated) {
      switch (currentRoute) {
        case 'signup':
          return <SignupPage onNavigate={handleNavigate} />
        case 'login':
        default:
          return <LoginPage onNavigate={handleNavigate} />
      }
    }

    // Show protected routes if authenticated
    switch (currentRoute) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />
      case 'settings':
        return <SettingsPage onNavigate={handleNavigate} />
      case 'login':
      case 'signup':
        // Redirect authenticated users away from auth pages
        return <HomePage onNavigate={handleNavigate} />
      default:
        return <HomePage onNavigate={handleNavigate} />
    }
  }

  // Determine if we should show back button and theme toggle
  const showBackButton = currentRoute === 'settings'
  const showThemeToggle = currentRoute === 'home'

  return (
    <RootLayout 
      showThemeToggle={showThemeToggle} 
      showBackButton={showBackButton}
      onBack={showBackButton ? () => handleNavigate('home') : undefined}
    >
      {renderCurrentRoute()}
    </RootLayout>
  )
}

// Wrapper with AuthProvider
export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
