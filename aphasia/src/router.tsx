import { ThemeProvider } from '@/components/theme-provider'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { SignupForm } from '@/components/SignupForm'
import { LoginForm } from '@/components/LoginForm'
import { Reviews } from '@/components/Reviews'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

// Simple routing state management
type Route = 'home' | 'signup' | 'login'

// Layout component for all routes
function RootLayout({ children, showThemeToggle = true, showBackButton = false, onBack, isAuthPage = false }: { 
  children: React.ReactNode
  showThemeToggle?: boolean
  showBackButton?: boolean
  onBack?: () => void
  isAuthPage?: boolean
}) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="aphasia-theme">
      <div className={`min-h-screen ${isAuthPage ? 'flex flex-col' : 'flex items-center justify-center'} ${isAuthPage ? 'p-1' : 'p-0'}`}>
        {/* Theme Toggle - only show on home page */}
        {showThemeToggle && (
          <div className="absolute top-4 right-4">
            <ModeToggle />
          </div>
        )}
        
        {/* Back Button - show on all pages except home */}
        {showBackButton && onBack && (
          <div className="absolute top-4 left-4">
            <Button
              onClick={onBack}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className={`w-full ${isAuthPage ? 'flex-1 flex flex-col justify-start pt-16' : 'max-w-md'}`}>
          {children}
        </div>
      </div>
    </ThemeProvider>
  )
}

// Home page component
function HomePage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return <Reviews onNavigate={onNavigate} />
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
export function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('home')

  const handleNavigate = (route: Route) => {
    setCurrentRoute(route)
  }

  const renderCurrentRoute = () => {
    switch (currentRoute) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />
      case 'signup':
        return <SignupPage onNavigate={handleNavigate} />
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />
      default:
        return <HomePage onNavigate={handleNavigate} />
    }
  }

  return (
    <RootLayout 
      showThemeToggle={false} 
      showBackButton={currentRoute !== 'home'}
      onBack={currentRoute !== 'home' ? () => handleNavigate('home') : undefined}
    >
      {renderCurrentRoute()}
    </RootLayout>
  )
}
