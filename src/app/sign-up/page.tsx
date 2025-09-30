// 🔐 APA-HARDENED SIGN-UP PAGE
// Allows account creation for new users
// Verified: 2025-07-03

'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SignUpForm from './sign-up-form'

export default function SignUpPage() {
  const router = useRouter()

  // Clear any existing session state to prevent dashboard flash during child signup
  useEffect(() => {
    const clearExistingSession = async () => {
      try {
        // Check if there's an existing session
        const response = await fetch('/api/auth/status', {
          cache: 'no-store',
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // If user is already authenticated and on signup page, 
          // they might be trying to create a new account
          if (data.user?.id) {
            console.log('[SIGNUP] Detected existing session, clearing to prevent redirect flash')
            
            // Clear the session to prevent redirect conflicts
            await fetch('/api/sign-out', {
              method: 'POST',
              credentials: 'include',
            })
          }
        }
      } catch (error) {
        // Silently handle errors - user can still proceed with signup
        console.log('[SIGNUP] Session check failed, proceeding with signup')
      }
    }

    clearExistingSession()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-300 w-full max-w-md mx-auto space-y-4">
        <Suspense fallback={<div>Loading form...</div>}>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  )
}
