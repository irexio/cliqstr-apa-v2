/**
 * ⚡ Magic Link Verification Page
 * 
 * Handles magic link verification when users click the link in their email
 */

import { Suspense } from 'react';
import MagicLinkVerifyClient from './_client';

export default function MagicLinkVerifyPage() {
  return (
    <div className="min-h-screen bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Suspense fallback={
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your magic link...</p>
          </div>
        }>
          <MagicLinkVerifyClient />
        </Suspense>
      </div>
    </div>
  );
}
