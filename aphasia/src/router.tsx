import { ThemeProvider } from '@/components/theme-provider'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SignupForm } from '@/components/SignupForm'
import { LoginForm } from '@/components/LoginForm'
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
      <div className={`min-h-screen ${isAuthPage ? 'flex flex-col' : 'flex items-center justify-center'} p-4`}>
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
        
        <div className={`w-full max-w-md ${isAuthPage ? 'flex-1 flex flex-col justify-start pt-16' : ''}`}>
          {children}
        </div>
      </div>
    </ThemeProvider>
  )
}

// Home page component
function HomePage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <div className="space-y-6">
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
        <Button onClick={() => onNavigate('signup')} className="w-full" size="lg">
          Get Started - Sign Up
        </Button>
        <Button onClick={() => onNavigate('login')} variant="outline" className="w-full" size="lg">
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
      showThemeToggle={currentRoute === 'home'} 
      showBackButton={currentRoute !== 'home'}
      onBack={currentRoute !== 'home' ? () => handleNavigate('home') : undefined}
    >
      {renderCurrentRoute()}
    </RootLayout>
  )
}
