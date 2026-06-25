import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { API_BASE_URL } from '@/lib/constants'
import client from '@/api/client'

export function DebugPage() {
  const [status, setStatus] = useState<string>('Not checked')
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function checkBackend() {
    setStatus('Checking...')
    setError(null)
    setApiResponse(null)

    try {
      // Try to hit a health endpoint or any public endpoint
      const response = await client.get('/api/v1/health')
      setStatus('✅ Backend is reachable')
      setApiResponse(response.data)
    } catch (err: any) {
      setStatus('❌ Backend is NOT reachable')
      setError(err.message || 'Unknown error')
      if (err.response) {
        setApiResponse({
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">🔍 Debug Page</h1>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">API_BASE_URL:</span>
              <code className="text-gray-900">{API_BASE_URL || '(empty - using proxy)'}</code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">Vite Proxy Target:</span>
              <code className="text-gray-900">http://localhost:8080</code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">Frontend URL:</span>
              <code className="text-gray-900">{window.location.origin}</code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Button onClick={checkBackend}>Check Backend</Button>
              <span className="text-sm font-medium">{status}</span>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-medium text-red-800">Error:</p>
                <pre className="text-xs text-red-700 mt-1 whitespace-pre-wrap">{error}</pre>
              </div>
            )}

            {apiResponse && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm font-medium text-gray-800 mb-2">Response:</p>
                <pre className="text-xs text-gray-700 overflow-auto max-h-96">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Make sure the backend (api-gateway) is running on port 8080</li>
              <li>Check if you have a registered user (go to /register)</li>
              <li>Open browser DevTools (F12) and check the Network tab</li>
              <li>Look for any CORS errors in the Console tab</li>
              <li>Try registering a new account first before logging in</li>
            </ol>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = '/register'}>
            Go to Register
          </Button>
        </div>
      </div>
    </div>
  )
}
