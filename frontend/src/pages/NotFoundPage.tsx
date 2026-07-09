import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { AlertCircle } from 'lucide-react'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <AlertCircle className="h-20 w-20 text-error-600" />
        </div>
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-white mb-2">404</h1>
        <p className="text-h3 text-neutral-600 dark:text-neutral-400 mb-6">Page not found</p>
        <p className="text-body-md text-neutral-500 dark:text-neutral-400 mb-8 max-w-md">
          Sorry, the page you're looking for doesn't exist. Please check the URL and try again.
        </p>
        <Link to="/dashboard">
          <Button variant="primary">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
