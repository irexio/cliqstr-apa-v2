'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/Button';

interface ApprovalData {
  id: string;
  childFirstName: string;
  childLastName: string;
  childBirthdate: string;
  parentEmail: string;
  context: 'direct_signup' | 'child_invite';
  inviteId?: string;
  cliqId?: string;
  inviterName?: string;
  cliqName?: string;
  parentState: 'new' | 'existing_parent' | 'existing_adult';
  status: 'pending' | 'approved' | 'declined' | 'expired';
  expiresAt: number;
}

export default function ParentApprovalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalData, setApprovalData] = useState<ApprovalData | null>(null);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('No approval token provided');
      setLoading(false);
      return;
    }

    fetchApprovalData(token);
  }, [token]);

  const fetchApprovalData = async (approvalToken: string) => {
    try {
      console.log('[PARENT-APPROVAL] Fetching approval data for token:', approvalToken);
      
      const response = await fetch(`/api/parent-approval/check?token=${encodeURIComponent(approvalToken)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load approval request');
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('[PARENT-APPROVAL] Approval data:', data);
      
      if (data.approval) {
        setApprovalData(data.approval);
      } else {
        setError('No approval data found');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('[PARENT-APPROVAL] Error fetching approval data:', err);
      setError('Failed to load approval request');
      setLoading(false);
    }
  };

  const handleApproval = async (action: 'approve' | 'decline') => {
    if (!token || !approvalData) return;

    if (action === 'decline') {
      // Handle decline - just call the API
      setSubmitting(true);
      setError(null);

      try {
        const response = await fetch('/api/parent-approval/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            action: 'decline',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to decline request');
          setSubmitting(false);
          return;
        }

        if (data.redirectUrl) {
          router.push(data.redirectUrl);
        } else {
          router.push('/parent-approval-declined');
        }
      } catch (err) {
        console.error('[PARENT-APPROVAL] Error declining:', err);
        setError('Failed to decline request');
        setSubmitting(false);
      }
      return;
    }

    // Handle approve - validate form first
    if (!firstName.trim() || !lastName.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log(`[PARENT-APPROVAL] Creating parent account and approving for token:`, token);
      
      // First, approve the parent approval
      const approveResponse = await fetch('/api/parent-approval/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          action: 'approve',
        }),
      });

      const approveData = await approveResponse.json();
      console.log(`[PARENT-APPROVAL] Approve response:`, approveData);

      if (!approveResponse.ok) {
        setError(approveData.error || 'Failed to approve request');
        setSubmitting(false);
        return;
      }

      // Then create the parent account
      const signupResponse = await fetch('/api/parent-approval/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: approvalData.parentEmail,
          password: password.trim(),
          birthdate: new Date().toISOString().split('T')[0], // Use current date as placeholder
          approvalToken: token,
        }),
      });

      const signupData = await signupResponse.json();
      console.log(`[PARENT-APPROVAL] Signup response:`, signupData);

      if (!signupResponse.ok) {
        setError(signupData.error || 'Failed to create parent account');
        setSubmitting(false);
        return;
      }

      // Redirect to plan selection
      console.log(`[PARENT-APPROVAL] Redirecting to plan selection`);
      router.push(`/choose-plan?approvalToken=${encodeURIComponent(token)}`);
      
    } catch (err) {
      console.error(`[PARENT-APPROVAL] Error approving:`, err);
      setError(`Failed to approve request`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        <p className="text-gray-600">Fetching approval request</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => router.push('/')} variant="outline">
          Go to Home
        </Button>
      </div>
    );
  }

  if (!approvalData) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">No Approval Request Found</h2>
        <p className="text-gray-600 mb-4">The approval request could not be found or has expired.</p>
        <Button onClick={() => router.push('/')} variant="outline">
          Go to Home
        </Button>
      </div>
    );
  }

  const childName = `${approvalData.childFirstName} ${approvalData.childLastName}`;
  const isExpired = Date.now() > approvalData.expiresAt;

  if (isExpired) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-yellow-800 mb-2">Request Expired</h2>
        <p className="text-yellow-600 mb-4">
          This approval request for <strong>{childName}</strong> has expired.
        </p>
        <Button onClick={() => router.push('/')} variant="outline">
          Go to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-green-900 mb-2">
          Parent Account Setup
        </h3>
        <p className="text-green-800 text-sm">
          Your child <strong>{childName}</strong> wants to join Cliqstr. 
          Let's create your parent account to approve their request.
        </p>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); handleApproval('approve'); }} className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            required
            autoComplete="given-name"
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
            autoComplete="family-name"
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
            value={new Date().toISOString().split('T')[0]}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
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
            value={approvalData.parentEmail}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
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
          {submitting ? 'Creating Account...' : 'Create Account'}
        </Button>
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => handleApproval('decline')}
          disabled={submitting}
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Decline
        </Button>
      </form>
    </div>
  );
}
