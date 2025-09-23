import { Suspense } from 'react';
import MagicLinkClient from './_client';

/**
 * 🪄 Magic Link Authentication Page
 * 
 * Handles both magic link requests and verification
 */
export default function MagicLinkPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🪄 Magic Link
          </h1>
          <p className="text-gray-600">
            Sign in without a password
          </p>
        </div>
        
        <Suspense fallback={
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        }>
          <MagicLinkClient />
        </Suspense>
      </div>
    </div>
  );
}
