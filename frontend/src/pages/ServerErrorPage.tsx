import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { AlertTriangle } from 'lucide-react'

export const ServerErrorPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <AlertTriangle className="h-20 w-20 text-warning-600" />
        </div>
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-white mb-2">500</h1>
        <p className="text-h3 text-neutral-600 dark:text-neutral-400 mb-6">Server Error</p>
        <p className="text-body-md text-neutral-500 dark:text-neutral-400 mb-8 max-w-md">
          Something went wrong on our end. Our team has been notified and is working on a fix. Please try again later.
        </p>
        <Link to="/dashboard">
          <Button variant="primary">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
