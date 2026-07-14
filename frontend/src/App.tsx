import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { ResourcesPage } from './pages/ResourcesPage'
import { CatalogPage } from './pages/CatalogPage'
import { GovernancePage } from './pages/GovernancePage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        {isAuthenticated ? (
          <>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/governance" element={<GovernancePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App
