'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface ApprovalData {
  childFirstName: string;
  childLastName: string;
  parentEmail: string;
  parentState: string;
}

export default function ParentApprovalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const urlParentState = searchParams.get('parentState') as 'new_parent' | 'existing_adult' | 'existing_parent' | null;
  
  const [approvalData, setApprovalData] = useState<ApprovalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid approval link');
      setLoading(false);
      return;
    }

    const fetchApprovalData = async () => {
      try {
        const response = await fetch(`/api/parent-approval/check?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load approval data');
        }
        
        setApprovalData(data.approval);
        setEmail(data.approval.parentEmail || '');
      } catch (err) {
        console.error('Error fetching approval data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load approval data');
      } finally {
        setLoading(false);
      }
    };

    fetchApprovalData();
  }, [token]);

  const handleNewParentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setSubmitting(true);
    setError('');

    try {
      const signupResponse = await fetch('/api/parent-approval/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalToken: token,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password: password.trim(),
          birthdate: birthdate.trim(),
        }),
      });

      if (!signupResponse.ok) {
        const errorData = await signupResponse.json();
        throw new Error(errorData.error || 'Failed to create parent account');
      }

      console.log('[PARENT_APPROVAL] New parent signup successful, redirecting to plan selection');
      router.push('/choose-plan?approvalToken=' + encodeURIComponent(token));
    } catch (err) {
      console.error('Error during signup:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  };

  const handleExistingAdultSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setSubmitting(true);
    setError('');

    try {
      console.log('[PARENT_APPROVAL] Existing adult signing in with email:', email);

      // Sign in existing adult
      const signInResponse = await fetch('/api/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          approvalToken: token,
          parentState: 'existing_adult',
        }),
      });

      if (!signInResponse.ok) {
        const errorData = await signInResponse.json();
        throw new Error(errorData.error || 'Failed to sign in');
      }

      console.log('[PARENT_APPROVAL] Existing adult signed in successfully, upgrade should have occurred');
      // After successful sign-in with role upgrade, redirect to Parents HQ
      router.push('/parents/hq/manage?approvalToken=' + encodeURIComponent(token));
    } catch (err) {
      console.error('Error during sign-in:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  };

  const handleExistingParentSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setSubmitting(true);
    setError('');

    try {
      console.log('[PARENT_APPROVAL] Existing parent signing in with email:', email);

      // Sign in existing parent
      const signInResponse = await fetch('/api/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          approvalToken: token,
        }),
      });

      if (!signInResponse.ok) {
        const errorData = await signInResponse.json();
        throw new Error(errorData.error || 'Failed to sign in');
      }

      console.log('[PARENT_APPROVAL] Existing parent signed in successfully');
      // After successful sign-in, mark approval as accepted and redirect to Parents HQ
      const approveResponse = await fetch('/api/parent-approval/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'approve' }),
      });

      if (!approveResponse.ok) {
        const errorData = await approveResponse.json();
        throw new Error(errorData.error || 'Failed to approve request');
      }

      router.push('/parents/hq/manage?approvalToken=' + encodeURIComponent(token));
    } catch (err) {
      console.error('Error during sign-in:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/parent-approval/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'decline' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to decline request');
      }

      router.push('/parent-approval-declined');
    } catch (err) {
      console.error('Error declining:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading approval request...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-red-800 mb-2">Approval Link Issue</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button 
              onClick={() => router.push('/parents/hq')}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              Go to Parents HQ
            </Button>
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Go to Home Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!approvalData) {
    return (
      <div className="text-center">
        <p className="text-gray-600">No approval data found</p>
      </div>
    );
  }

  const childName = `${approvalData.childFirstName} ${approvalData.childLastName}`;
  const parentState = urlParentState || 'new_parent'; // Fallback to new_parent

  console.log('[PARENT_APPROVAL] Rendering with parentState:', parentState);

  // ========== NEW PARENT FLOW ==========
  if (parentState === 'new_parent') {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-green-900 mb-2">
            Welcome to Cliqstr!
          </h3>
          <p className="text-green-800 text-sm">
            Your child <strong>{childName}</strong> wants to join Cliqstr. 
            Let's create your parent account to approve their request.
          </p>
        </div>
        
        <form onSubmit={handleNewParentSignup} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              required
              autoComplete="off"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              required
              autoComplete="off"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
              Birthdate
            </label>
            <input
              id="birthdate"
              type="date"
              required
              autoComplete="off"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white"
          >
            {submitting ? 'Creating Account...' : 'Create Parent Account'}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleDecline}
            disabled={submitting}
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Decline
          </Button>
        </form>
      </div>
    );
  }

  // ========== EXISTING ADULT FLOW ==========
  if (parentState === 'existing_adult') {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            Upgrade Your Account
          </h3>
          <p className="text-blue-800 text-sm">
            Your child <strong>{childName}</strong> wants to join Cliqstr. 
            We found your account — let's upgrade you to a parent account so you can approve their request.
          </p>
        </div>
        
        <form onSubmit={handleExistingAdultSignIn} className="space-y-4">
          <div>
            <label htmlFor="email-adult" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email-adult"
              type="email"
              required
              autoComplete="email"
              value={email}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="password-adult" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password-adult"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white"
          >
            {submitting ? 'Signing In...' : 'Sign In & Upgrade to Parent'}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleDecline}
            disabled={submitting}
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Decline
          </Button>
        </form>
      </div>
    );
  }

  // ========== EXISTING PARENT FLOW ==========
  if (parentState === 'existing_parent') {
    return (
      <div className="space-y-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-purple-900 mb-2">
            Welcome Back!
          </h3>
          <p className="text-purple-800 text-sm">
            Your child <strong>{childName}</strong> is ready to join Cliqstr. 
            Sign in to your parent account to approve the request and set up permissions.
          </p>
        </div>
        
        <form onSubmit={handleExistingParentSignIn} className="space-y-4">
          <div>
            <label htmlFor="email-parent" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email-parent"
              type="email"
              required
              autoComplete="email"
              value={email}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="password-parent" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password-parent"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white"
          >
            {submitting ? 'Signing In...' : 'Sign In to Approve'}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleDecline}
            disabled={submitting}
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Decline
          </Button>
        </form>
      </div>
    );
  }

  // Should never reach here
  return (
    <div className="text-center">
      <p className="text-red-600">Invalid parent state</p>
    </div>
  );
}
