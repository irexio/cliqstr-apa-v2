'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function InviteAcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const code = searchParams.get('code');

  useEffect(() => {
    if (!code) {
      setError('No invite code provided');
      setLoading(false);
      return;
    }
    checkInviteToken(code);
  }, [code]);

  const checkInviteToken = async (token: string) => {
    try {
      console.log('[INVITE_ACCEPT] Checking token:', token);
      
      // First, try to check if it's a parent approval token
      const parentResponse = await fetch(`/api/parent-approval/accept?token=${encodeURIComponent(token)}`);
      console.log('[INVITE_ACCEPT] Parent approval response status:', parentResponse.status);
      
      if (parentResponse.ok) {
        const parentData = await parentResponse.json();
        console.log('[INVITE_ACCEPT] Parent approval data:', parentData);
        
        if (parentData.approval) {
          console.log('[INVITE_ACCEPT] Found parent approval, parent state:', parentData.approval.parentState);
          
          // This is a parent approval token - handle as before
          if (parentData.approval.parentState === 'existing_parent') {
            console.log('[INVITE_ACCEPT] Redirecting existing parent to Parents HQ');
            router.push(`/parents/hq/dashboard?approvalToken=${encodeURIComponent(token)}`);
          } else {
            console.log('[INVITE_ACCEPT] Redirecting new parent to signup');
            router.push(`/sign-up?email=${encodeURIComponent(parentData.approval.parentEmail)}&approvalToken=${encodeURIComponent(token)}`);
          }
          return;
        } else {
          console.log('[INVITE_ACCEPT] No approval data in response');
        }
      } else {
        console.log('[INVITE_ACCEPT] Parent approval response not ok:', parentResponse.status);
      }

      // If not a parent approval token, try to validate as a regular invite
      const inviteResponse = await fetch(`/api/invites/validate?code=${encodeURIComponent(token)}`);
      if (!inviteResponse.ok) {
        setError('Invalid invite code');
        setLoading(false);
        return;
      }
      
      const inviteData = await inviteResponse.json();
      if (!inviteData.valid) {
        setError('Invalid invite code');
        setLoading(false);
        return;
      }

      // Store invite context for the flow
      sessionStorage.setItem('inviteContext', JSON.stringify({
        inviteCode: token,
        inviteType: inviteData.inviteType || 'adult',
        cliqName: inviteData.cliqName,
        inviterName: inviteData.inviterName,
        recipientEmail: inviteData.recipientEmail,
        method: 'email'
      }));

      // For any invite with a recipient email, check if user needs to authenticate
      const inviteType = inviteData.inviteType || 'adult';
      if (inviteData.recipientEmail) {
        console.log('[INVITE_ACCEPT] Invite with email, checking if user needs authentication');
        
        // Check if this email belongs to an existing user
        try {
          const userCheckResponse = await fetch(`/api/auth/check-user?email=${encodeURIComponent(inviteData.recipientEmail)}`);
          const userCheckData = await userCheckResponse.json();
          
          if (userCheckData.exists) {
            console.log('[INVITE_ACCEPT] Email belongs to existing user, showing auth options');
            setLoading(false);
            setError(null);
            // Store the email and invite code for the auth options screen
            sessionStorage.setItem('invitedEmail', inviteData.recipientEmail);
            sessionStorage.setItem('inviteCode', token);
            router.push(`/invite/auth-options?email=${encodeURIComponent(inviteData.recipientEmail)}&code=${encodeURIComponent(token)}`);
            return;
          }
        } catch (error) {
          console.error('[INVITE_ACCEPT] Error checking if user exists:', error);
        }
      }

      // Route based on invite type
      
      if (inviteType === 'adult') {
        console.log('[INVITE_ACCEPT] Routing adult to choose-plan');
        router.push('/choose-plan');
      } else if (inviteType === 'parent') {
        console.log('[INVITE_ACCEPT] Routing parent to invite/parent');
        router.push(`/invite/parent?code=${token}`);
      } else if (inviteType === 'child') {
        console.log('[INVITE_ACCEPT] Routing child to parent-approval');
        router.push('/parent-approval');
      } else {
        // Fallback to adult flow
        console.log('[INVITE_ACCEPT] Unknown invite type, defaulting to choose-plan');
        router.push('/choose-plan');
      }

    } catch (err) {
      console.error('Error checking invite token:', err);
      setError('Failed to verify invite code');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying approval code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Verification Failed</h2>
            <p className="text-red-600">{error}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Parents HQ...</p>
      </div>
    </div>
  );
}

export default function InviteAcceptClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading approval verification...</h1>
          <div className="animate-pulse flex justify-center">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    }>
      <InviteAcceptContent />
    </Suspense>
  );
}


