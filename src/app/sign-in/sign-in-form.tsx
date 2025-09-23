'use client';

// 🔐 APA-HARDENED — SIGN-IN FORM
// Posts to /api/sign-in, then fetches /auth/status to verify session
// Includes fallback to /api/auth/status for deployment edge cases
// Auto-logout security for APA compliance

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PasswordInput from '@/components/ui/PasswordInput';

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);

  // Check for security-related message in URL parameters
  useEffect(() => {
    const message = searchParams.get('message');
    const resetSuccess = searchParams.get('reset');
    const verified = searchParams.get('verified');
    
    if (message) {
      setSecurityMessage(decodeURIComponent(message));
    } else if (resetSuccess === 'success') {
      setSecurityMessage('Your password has been reset successfully. Please sign in with your new password.');
    } else if (verified === 'true') {
      setSecurityMessage('Your email has been verified successfully! Please sign in to continue.');
    }
  }, [searchParams]);

  const hardNavigate = (url: string) => {
    // Force a full page load so the server sees the session cookie on first paint
    if (typeof window !== 'undefined') {
      window.location.assign(url);
    } else {
      router.push(url);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 🔐 Step 1: Authenticate via POST
      const res = await fetch('/api/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      let signInData;
      try {
        signInData = await res.json();
      } catch (parseErr) {
        console.error('Failed to parse sign-in response:', parseErr);
      }

      if (!res.ok) {
        let message = 'Unable to sign in. Please check your credentials.';
        if (signInData?.error === 'Invalid credentials') {
          message = 'The email or password you entered is incorrect.';
        } else if (signInData?.error === 'Awaiting parent approval') {
          message = 'Your account requires parent approval before signing in.';
        } else if (signInData?.error === 'Email not verified') {
          message = 'Please verify your email before signing in.';
          if (signInData.email) {
            localStorage.setItem('pendingVerificationEmail', signInData.email);
          }
          hardNavigate('/verification-pending');
          return;
        } else if (signInData?.error) {
          message = signInData.error;
        }
        throw new Error(message);
      }

      const directUserData = signInData?.user;

      // 🔐 APA-SAFE: Wait briefly for cookie to sync
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 🔍 Step 2: Fetch verified session
      let userData;
      let attemptCount = 0;
      const maxAttempts = 2;

      while (attemptCount < maxAttempts) {
        attemptCount++;
        try {
          const userRes = await fetch('/api/auth/status', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
            credentials: 'include',
            cache: 'no-store',
          });

          if (!userRes.ok) {
            const altRes = await fetch('/api/auth/status', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
              credentials: 'include',
              cache: 'no-store',
            });

            if (!altRes.ok) {
              if (attemptCount >= maxAttempts) {
                throw new Error('Unable to verify your session. Please try again.');
              }
              await new Promise((resolve) => setTimeout(resolve, 500));
              continue;
            }

            userData = await altRes.json();
            break;
          } else {
            userData = await userRes.json();
            break;
          }
        } catch (err) {
          console.error(`Session fetch error (attempt ${attemptCount}):`, err);
          if (attemptCount >= maxAttempts) {
            throw new Error('Unable to verify your session. Please try again.');
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      const user = directUserData || userData?.user;

      if (!user || !user.id) {
        console.error('Missing user ID in responses:', { directUserData, statusData: userData });
        throw new Error('Your session could not be established. Please try signing in again.');
      }

      const account = userData?.user?.account || user.account;
      const profile = userData?.user?.myProfile || user.myProfile;

      // 🚫 Block unapproved children
      if (account?.role === 'Child' && !account.isApproved) {
        hardNavigate('/approval-pending');
        return;
      }

      // 🧾 Plan check
      if (!account?.plan) {
        hardNavigate('/choose-plan');
        return;
      }

      // Parent invite/approval contexts
      const parentApprovalContext = sessionStorage.getItem('parentApprovalContext');
      if (parentApprovalContext) {
        try {
          const { inviteCode, childId } = JSON.parse(parentApprovalContext);
          sessionStorage.removeItem('parentApprovalContext');
          hardNavigate(`/parent-approval?inviteCode=${inviteCode}&childId=${childId}`);
          return;
        } catch {}
      }

      const parentInviteContext = sessionStorage.getItem('parentInviteContext');
      if (parentInviteContext) {
        try {
          const { inviteCode } = JSON.parse(parentInviteContext);
          sessionStorage.removeItem('parentInviteContext');
          hardNavigate(`/invite/parent?code=${inviteCode}`);
          return;
        } catch {}
      }

      // Final redirect
      const returnTo = searchParams.get('returnTo');
      if (returnTo) {
        hardNavigate(decodeURIComponent(returnTo));
        return;
      }

      if (account?.role === 'Parent') {
        hardNavigate('/parents/hq/dashboard');
        return;
      }

      hardNavigate('/my-cliqs-dashboard');
    } catch (err: any) {
      console.error('❌ Sign-in error:', err);
      setError(err.message || 'Something went wrong while signing in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      {/* 🔐 APA-HARDENED - Security notification */}
      {securityMessage && (
        <div className="p-3 rounded bg-blue-50 border border-blue-100 mb-4">
          <div className="flex">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm text-blue-800 font-medium">{securityMessage}</p>
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium">Email or Username</label>
        <input type="text" autoComplete="username email" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full border px-3 py-2 rounded text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium">Password</label>
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="text-sm" autoComplete="current-password" required />
      </div>
      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-100">
          <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
        </div>
      )}
      <button type="submit" disabled={loading} className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 text-sm w-full hover:text-[#c032d1]">
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
      
      <div className="text-center">
        <button 
          type="button" 
          onClick={() => router.push('/auth/magic')}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          🪄 Sign in with Magic Link (No Password)
        </button>
      </div>
    </form>
  );
}
