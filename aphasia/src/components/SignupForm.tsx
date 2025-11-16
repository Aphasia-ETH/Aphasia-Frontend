import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { useState } from 'react'
import { ApiClientError } from '@/lib/api'
import { useAuth } from '@/lib/auth'

interface SignupFormProps {
  onSwitchToLogin: () => void
  onClose?: () => void
}

interface SignupFormData {
  email: string
  password: string
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const { signup } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<SignupFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    try {
      await signup(data.email, data.password, data.email.split('@')[0])
      
      toast.success('Account created!', {
        description: 'Welcome to Aphasia! You can now start using the extension.',
      })
      
      // Navigate to home after successful signup
      // The router will handle the navigation automatically
    } catch (error) {
      let errorMessage: string
      if (error instanceof ApiClientError) {
        errorMessage = error.message || 'Signup failed'
      } else if (error instanceof Error) {
        errorMessage = error.message || 'Please try again later.'
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as any).message) || 'Please try again later.'
      } else {
        errorMessage = 'Please try again later.'
      }
      
      toast.error('Signup failed', {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto shadow-lg transition-all hover:scale-105">
            <span className="text-primary-foreground font-bold text-3xl">A</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Aphasia</h1>
            <h2 className="text-xl font-semibold">Sign Up</h2>
            <p className="text-sm text-muted-foreground">Create your account to get started</p>
          </div>
        </div>

        {/* Email and Password Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Password"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </>
              ) : (
                'Sign up'
              )}
            </Button>
          </form>
        </Form>

        {/* Login Link */}
        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button
              onClick={onSwitchToLogin}
              variant="link"
              className="p-0 h-auto"
            >
              Log in
            </Button>
          </span>
        </div>

        {/* Legal Text */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            By signing up you agree to our{' '}
            <Button variant="link" className="p-0 h-auto text-xs">terms</Button>
            {' '}and have read the{' '}
            <Button variant="link" className="p-0 h-auto text-xs">privacy policy</Button>.
          </p>
        </div>
      </div>
    </div>
  )
}
