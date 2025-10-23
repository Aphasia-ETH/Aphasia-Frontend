import { ThemeProvider } from '@/components/theme-provider'
import { AuthPage } from '@/components/AuthPage'
import './App.css'

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="aphasia-theme">
      <AuthPage />
    </ThemeProvider>
  )
}
