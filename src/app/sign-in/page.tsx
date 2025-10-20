// 🔐 APA-HARDENED SIGN-IN PAGE
// Secure sign-in page with traditional password authentication

'use client'

import { Suspense } from 'react'
import SignInForm from './sign-in-form'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black/80">
      <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-300 w-full max-w-md mx-auto space-y-4">
        <Suspense fallback={<div>Loading form...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  )
}
