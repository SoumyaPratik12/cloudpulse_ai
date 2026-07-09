import React from 'react'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'
import { Card } from '../components/Card'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('Login:', { email, password })
    } catch (err) {
      setError('Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 dark:from-neutral-900 dark:to-neutral-800 px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-body-md text-neutral-600 dark:text-neutral-400">Sign in to your CloudPulse account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-error-50 dark:bg-error-900/20 text-error-600 text-body-sm">
              {error}
            </div>
          )}

          <FormField
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
            required
          />

          <FormField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
            required
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-body-sm text-neutral-600 dark:text-neutral-400">Remember me</span>
            </label>
            <a href="#" className="text-body-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Forgot password?
            </a>
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-body-md text-neutral-600 dark:text-neutral-400">
            Don't have an account?{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-semibold">
              Sign up
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}
