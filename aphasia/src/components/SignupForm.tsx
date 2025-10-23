import React from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface SignupFormProps {
  onSwitchToLogin: () => void
  onClose: () => void
}

interface SignupFormData {
  email: string
  password: string
}

export function SignupForm({ onSwitchToLogin, onClose }: SignupFormProps) {
  const form = useForm<SignupFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (data: SignupFormData) => {
    console.log('Signup data:', data)
    // Handle signup logic here
  }

  const handleGoogleSignup = () => {
    console.log('Google signup clicked')
    // Handle Google signup logic here
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <span className="text-sm text-muted-foreground">Aphasia: short description</span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
          >
            ✕
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
          >
            ✕
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-bold">Aphasia</h1>
          <h2 className="text-xl font-semibold">Sign Up</h2>
          <p className="text-sm text-muted-foreground">Sign up to xyz text.</p>
        </div>

        {/* Google Sign Up Button */}
        <Button
          onClick={handleGoogleSignup}
          variant="outline"
          className="w-full h-12 flex items-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign up with Google
        </Button>

        {/* Separator */}
        <div className="relative">
          <Separator />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-background px-2 text-sm text-muted-foreground">OR</span>
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

            <Button type="submit" className="w-full">
              Sign up
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
      </CardContent>
    </Card>
  )
}
