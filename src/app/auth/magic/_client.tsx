'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

/**
 * 🪄 Magic Link Client Component
 * 
 * Handles magic link requests and verification
 */
export default function MagicLinkClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'sent' | 'verifying'>('request');
  const [error, setError] = useState('');

  // Check if we're verifying a magic link
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  useEffect(() => {
    if (token && emailParam) {
      setStep('verifying');
      verifyMagicLink(token, emailParam);
    }
  }, [token, emailParam]);

  const requestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/magic/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send magic link');
      }

      setStep('sent');
      toast({
        title: 'Magic Link Sent!',
        description: 'Check your email and click the link to sign in.',
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyMagicLink = async (token: string, email: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/magic/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify magic link');
      }

      toast({
        title: 'Welcome back!',
        description: 'You have been signed in successfully.',
      });

      // Redirect to appropriate dashboard
      router.push('/my-cliqs-dashboard');
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Verification Failed',
        description: err.message,
        variant: 'destructive',
      });
      setStep('request');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'sent') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">📧 Check Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-4">📬</div>
            <p className="text-gray-600 mb-4">
              We've sent a magic link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Click the link in your email to sign in. The link will expire in 15 minutes.
            </p>
          </div>
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              onClick={() => setStep('request')}
              className="w-full"
            >
              Send Another Link
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/sign-in')}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verifying') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your magic link...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Request Magic Link</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={requestMagicLink} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </Button>

          <div className="text-center">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => router.push('/sign-in')}
              className="text-sm"
            >
              Back to Sign In
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">🔒 How Magic Links Work</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• No password required</li>
            <li>• Link expires in 15 minutes</li>
            <li>• Can only be used once</li>
            <li>• Safe and secure</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
