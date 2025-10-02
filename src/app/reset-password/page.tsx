'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/ui/PasswordInput';
import { fetchJson } from '@/lib/fetchJson';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'validating' | 'resetting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // Validate token on page load
  useEffect(() => {
    console.log('🔐 [RESET-PASSWORD] Page loaded, code from URL:', code);
    console.log('🔐 [RESET-PASSWORD] Full URL:', window.location.href);
    
    if (!code) {
      console.log('🔐 [RESET-PASSWORD] No code found in URL');
      setError('Invalid or missing reset code');
      setStatus('error');
      return;
    }

    console.log('🔐 [RESET-PASSWORD] Code found, validating token...');
    validateToken();
  }, [code]);

  const validateToken = async () => {
    setStatus('validating');
    try {
      console.log('🔐 [RESET-PASSWORD] Validating token:', code?.substring(0, 8) + '...');
      const response = await fetch(`/api/auth/validate-reset-token?code=${encodeURIComponent(code!)}`);
      const data = await response.json();
      console.log('🔐 [RESET-PASSWORD] Validation response:', { status: response.status, data });
      
      if (response.ok) {
        setIsValidToken(true);
        setStatus('idle');
      } else {
        setIsValidToken(false);
        setError(data.error || 'Invalid or expired reset code');
        setStatus('error');
      }
    } catch (err) {
      console.error('🔐 [RESET-PASSWORD] Token validation error:', err);
      setIsValidToken(false);
      setError('Failed to validate reset code');
      setStatus('error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔐 [RESET-PASSWORD] Form submitted, isValidToken:', isValidToken);
    
    // Prevent submission if token validation hasn't completed or failed
    if (isValidToken !== true) {
      console.log('🔐 [RESET-PASSWORD] Blocking form submission - token not validated');
      setError('Please wait for token validation to complete');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setStatus('resetting');
    setError('');

    try {
      await fetchJson('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code,
          newPassword: password 
        }),
      });

      setStatus('success');
      
      // Redirect to sign-in after a brief delay
      setTimeout(() => {
        router.push('/sign-in?message=Password reset successfully. Please sign in with your new password.');
      }, 2000);

    } catch (err: any) {
      console.error('🔐 [RESET-PASSWORD] Error:', err);
      setError(err.message || 'Failed to reset password');
      setStatus('error');
    }
  };

  if (status === 'validating') {
    return (
      <main className="max-w-md mx-auto py-12 px-4 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Validating reset code...</p>
        </div>
      </main>
    );
  }

  if (isValidToken === false || status === 'error') {
    return (
      <main className="max-w-md mx-auto py-12 px-4 space-y-6">
        <h1 className="text-3xl font-bold text-[#202020] mb-6 font-poppins text-center">Reset Password</h1>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-900 font-semibold mb-2">Invalid Reset Link</h2>
          <p className="text-red-800 text-sm mb-4">{error}</p>
          <p className="text-red-700 text-sm">
            This reset link may have expired or already been used. Please request a new password reset.
          </p>
        </div>

        <div className="text-center">
          <Button 
            onClick={() => router.push('/forgot-password')}
            className="w-full"
          >
            Request New Reset Link
          </Button>
        </div>
      </main>
    );
  }

  if (status === 'success') {
    return (
      <main className="max-w-md mx-auto py-12 px-4 space-y-6">
        <h1 className="text-3xl font-bold text-[#202020] mb-6 font-poppins text-center">Password Reset</h1>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <h2 className="text-green-900 font-semibold mb-2">Success!</h2>
          <p className="text-green-800 text-sm">
            Your password has been reset successfully. Redirecting to sign-in...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto py-12 px-4 space-y-6">
      <h1 className="text-3xl font-bold text-[#202020] mb-6 font-poppins text-center">Reset Password</h1>

      <p className="text-sm text-gray-600 text-center">
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password">New Password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>


        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button 
          type="submit" 
          disabled={status === 'resetting'} 
          className="w-full"
        >
          {status === 'resetting' ? 'Resetting Password...' : 'Reset Password'}
        </Button>
      </form>
    </main>
  );
}
