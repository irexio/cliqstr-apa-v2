'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * ⚡ Magic Link Verification Client Component
 * 
 * Handles the magic link verification process when users click the link
 */
export default function MagicLinkVerifyClient() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyMagicLink = async () => {
      try {
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (!token || !email) {
          setStatus('error');
          setMessage('Invalid magic link. Please try again.');
          return;
        }

        console.log('[MAGIC-LINK-VERIFY] Verifying magic link:', { token, email });

        const response = await fetch('/api/auth/magic/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, email }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log('[MAGIC-LINK-VERIFY] Success:', data);
          setStatus('success');
          setMessage('Successfully signed in! Redirecting...');
          
          // Redirect to dashboard after a brief delay
          setTimeout(() => {
            router.push('/my-cliqs-dashboard');
          }, 2000);
        } else {
          console.error('[MAGIC-LINK-VERIFY] Error:', data);
          setStatus('error');
          setMessage(data.error || 'Failed to verify magic link. Please try again.');
        }
      } catch (error) {
        console.error('[MAGIC-LINK-VERIFY] Network error:', error);
        setStatus('error');
        setMessage('Network error. Please check your connection and try again.');
      }
    };

    verifyMagicLink();
  }, [searchParams, router]);

  if (status === 'verifying') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">⚡ Verifying Magic Link</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Please wait while we verify your magic link...</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'success') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-green-600">⚡ Success!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-gray-600 mb-4">{message}</p>
          <p className="text-sm text-gray-500">You will be redirected to your dashboard shortly.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-red-600">⚡ Verification Failed</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="text-6xl mb-4">❌</div>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="space-y-2">
          <Button 
            onClick={() => router.push('/sign-in')}
            className="w-full"
          >
            Back to Sign In
          </Button>
          <Button 
            onClick={() => router.push('/auth/magic')}
            variant="outline"
            className="w-full"
          >
            Try Magic Link Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
