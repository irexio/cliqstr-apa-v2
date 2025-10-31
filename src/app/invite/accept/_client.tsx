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
            router.push(`/parents/hq?token=${encodeURIComponent(token)}`);
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

      // If the user is already authenticated, handle auto-join for eligible cases
      try {
        const authRes = await fetch('/api/auth/status', { method: 'GET', cache: 'no-store', credentials: 'include' });
        if (authRes.ok) {
          const { user } = await authRes.json();
          if (user?.id) {
            // 🔐 SECURITY: Verify the authenticated user's email matches the invite recipient
            // This prevents session hijacking where someone accepts an invite meant for another email
            const userEmail = user.email?.toLowerCase().trim();
            const inviteEmail = inviteData.recipientEmail?.toLowerCase().trim();
            
            console.log('[INVITE_ACCEPT] Auth check - User email:', userEmail, 'Invite email:', inviteEmail);
            
            if (userEmail !== inviteEmail) {
              console.warn('[INVITE_ACCEPT] ⚠️ EMAIL MISMATCH - User is logged in as different account!');
              console.warn(`[INVITE_ACCEPT] User: ${userEmail}, Invite for: ${inviteEmail}`);
              // Force re-authentication - redirect to sign-out with proper redirect URL
              const signInUrl = `/sign-in?email=${encodeURIComponent(inviteEmail)}&code=${encodeURIComponent(token)}`;
              return router.push(`/sign-out?redirect=${encodeURIComponent(signInUrl)}`);
            }
            
            // If this is an ADULT invite and the user already has a plan, auto-join immediately
            const hasPlan = !!(user.account?.plan || user.plan);
            if (inviteType === 'adult' && inviteData.cliqId && hasPlan) {
              console.log('[INVITE_ACCEPT] Authenticated adult with plan detected. Auto-joining to cliq:', inviteData.cliqId);
              try {
                const joinRes = await fetch(`/api/cliqs/${inviteData.cliqId}/join`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                });
                if (joinRes.ok) {
                  console.log('[INVITE_ACCEPT] Auto-join successful. Redirecting to My Cliqs Dashboard');
                  router.push('/my-cliqs-dashboard');
                  return;
                } else {
                  console.warn('[INVITE_ACCEPT] Auto-join failed with status:', joinRes.status, '— proceeding with normal flow');
                }
              } catch (joinErr) {
                console.error('[INVITE_ACCEPT] Auto-join error:', joinErr);
              }
            }
          }
        }
      } catch (authErr) {
        console.error('[INVITE_ACCEPT] Auth status check failed (non-fatal):', authErr);
      }

      // Route based on invite type

      if (inviteType === 'adult') {
        console.log('[INVITE_ACCEPT] Routing adult to choose-plan');
        console.log('[INVITE_ACCEPT] Adult invite data:', {
          recipientEmail: inviteData.recipientEmail,
          cliqId: inviteData.cliqId,
          cliqName: inviteData.cliqName,
          inviterName: inviteData.inviterName
        });
        
        // Store invite context for auto-join after plan selection
        sessionStorage.setItem('adultInviteContext', JSON.stringify({
          inviteCode: token,
          inviteType: 'adult',
          cliqName: inviteData.cliqName,
          inviterName: inviteData.inviterName,
          recipientEmail: inviteData.recipientEmail
        }));
        
        // For new users, route to sign-up first
        // For existing users who are authenticated, route to choose-plan
        if (!inviteData.recipientEmail || inviteData.recipientEmail.trim() === '') {
          console.log('[INVITE_ACCEPT] ⚠️ No recipient email provided, routing to choose-plan');
          router.push('/choose-plan');
        } else {
          // Route to sign-up with email pre-filled
          console.log('[INVITE_ACCEPT] ✅ Routing new adult to sign-up with email:', inviteData.recipientEmail);
          router.push(`/sign-up?email=${encodeURIComponent(inviteData.recipientEmail)}`);
        }
      } else if (inviteType === 'parent') {
        console.log('[INVITE_ACCEPT] Routing parent to invite/parent');
        router.push(`/invite/parent?code=${token}`);
      } else if (inviteType === 'child') {
        console.log('[INVITE_ACCEPT] Routing child invite to Parents HQ');
        router.push(`/parents/hq?inviteCode=${encodeURIComponent(token)}`);
      } else {
        // Fallback to sign-up for unknown invite types
        console.log('[INVITE_ACCEPT] Unknown invite type, defaulting to sign-up');
        // Store invite context for auto-join after plan selection
        sessionStorage.setItem('adultInviteContext', JSON.stringify({
          inviteCode: token,
          inviteType: 'adult',
          cliqName: inviteData.cliqName,
          inviterName: inviteData.inviterName,
          recipientEmail: inviteData.recipientEmail
        }));
        if (inviteData.recipientEmail && inviteData.recipientEmail.trim() !== '') {
          router.push(`/sign-up?email=${encodeURIComponent(inviteData.recipientEmail)}`);
        } else {
          router.push('/sign-up');
        }
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


