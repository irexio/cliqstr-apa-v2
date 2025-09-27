'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/label';
import { fetchJson } from '@/lib/fetchJson';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setStatus('sending');
    setError('');

    try {
      await fetchJson('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      setStatus('sent');
    } catch (err: any) {
      console.error('🔐 [FORGOT-PASSWORD] Error:', err);
      console.error('🔐 [FORGOT-PASSWORD] Error details:', {
        message: err.message,
        status: err.status,
        response: err.response
      });
      setError(err.message || 'Something went wrong.');
      setStatus('error');
    }
  };

  return (
    <main className="max-w-md mx-auto py-12 px-4 space-y-6">
      <h1 className="text-3xl font-bold text-[#202020] mb-6 font-poppins text-center">Forgot Password</h1>

      <p className="text-sm text-gray-600 text-center">
        Enter your email and we’ll send you a secure link to reset your password.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {status === 'sent' && (
          <p className="text-sm text-green-600">
            If your email is on file, a reset link has been sent.
          </p>
        )}

        <Button onClick={handleSubmit} disabled={status === 'sending'} className="w-full">
          {status === 'sending' ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </div>
    </main>
  );
}
