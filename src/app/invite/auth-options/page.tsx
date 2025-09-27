'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/Button';

export default function InviteAuthOptionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const codeParam = searchParams.get('code');
    
    if (emailParam) setEmail(emailParam);
    if (codeParam) setInviteCode(codeParam);
  }, [searchParams]);

  const handleSignIn = () => {
    // Store invite context and redirect to sign in
    sessionStorage.setItem('inviteContext', JSON.stringify({
      inviteCode,
      email,
      returnTo: `/invite/accept?code=${inviteCode}`
    }));
    router.push(`/sign-in?email=${encodeURIComponent(email)}`);
  };

  const handleResetPassword = () => {
    // Store invite context and redirect to forgot password
    sessionStorage.setItem('inviteContext', JSON.stringify({
      inviteCode,
      email,
      returnTo: `/invite/accept?code=${inviteCode}`
    }));
    router.push(`/forgot-password?email=${encodeURIComponent(email)}`);
  };

  const handleDifferentEmail = () => {
    // Clear stored data and redirect to manual invite entry
    sessionStorage.removeItem('invitedEmail');
    sessionStorage.removeItem('inviteCode');
    router.push(`/invite/manual?code=${inviteCode}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome Back!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We found an account for this email address
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Account found:</strong> {email}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              How would you like to continue?
            </h3>

            <Button
              onClick={handleSignIn}
              className="w-full"
            >
              Sign In with Password
            </Button>

            <Button
              onClick={handleResetPassword}
              variant="outline"
              className="w-full"
            >
              Reset Password
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={handleDifferentEmail}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-800 underline"
            >
              This isn't my email address
            </button>
          </div>

          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>After signing in or resetting your password, you'll be automatically added to the cliq.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
