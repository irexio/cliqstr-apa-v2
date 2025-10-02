"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ParentDashboard from './ParentDashboard';
import ChildSignupApprovalFlow from './ChildSignupApprovalFlow';
import PendingApprovalsSection from './PendingApprovalsSection';
import ExistingChildrenManagement from './ExistingChildrenManagement';
import CreateNewChildSection from './CreateNewChildSection';

type InviteStatus = 'valid' | 'used' | 'invalid' | 'loading';

export default function ParentsHQContent() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('inviteCode')?.trim() || '';
  const approvalToken = searchParams.get('approvalToken')?.trim() || '';
  const router = useRouter();

  const [status, setStatus] = useState<InviteStatus>('loading');
  const [authLoading, setAuthLoading] = useState(true);

  // 1) Auth gate: require login, allow Adult or Parent, block Child
  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/status', {
          credentials: 'include',
          cache: 'no-store',
        });
        const data = res.ok ? await res.json() : null;

        if (!data?.user) {
          // Allow unauthenticated users if they have a pending invite or approval token (signup flow)
          if (typeof document !== 'undefined') {
            const hasPendingInvite = document.cookie.includes('pending_invite=');
            if (hasPendingInvite || approvalToken) {
              // Let them proceed to signup wizard, don't redirect
              if (!cancelled) setAuthLoading(false);
              return;
            }
          }
          
          const rt = `/parents/hq${inviteCode ? `?inviteCode=${encodeURIComponent(inviteCode)}` : ''}`;
          router.replace(`/sign-in?returnTo=${encodeURIComponent(rt)}`);
          return;
        }

        // Block children from HQ
        if (data.user.role === 'Child') {
          router.replace('/awaiting-approval');
          return;
        }
      } catch (err) {
        console.error('[PARENTS_HQ] auth check failed:', err);
        const rt = `/parents/hq${inviteCode ? `?inviteCode=${encodeURIComponent(inviteCode)}` : ''}`;
        router.replace(`/sign-in?returnTo=${encodeURIComponent(rt)}`);
        return;
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    checkAuth();

    // Re-check when tab regains focus (avoids stale session)
    const vis = () => {
      if (!document.hidden) {
        setAuthLoading(true);
        checkAuth();
      }
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', vis);
    };
  }, [inviteCode, router]);

  // 2) Validation (inviteCode for invites, approvalToken for direct signups)
  useEffect(() => {
    let cancelled = false;

    async function validateRequest() {
      // If we have an approvalToken (direct child signup), validate it
      if (approvalToken) {
        setStatus('loading');
        try {
          const res = await fetch(`/api/parent-approval/check?token=${encodeURIComponent(approvalToken)}`, {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
          });
          const data = await res.json();

          if (!res.ok || !data.approval) {
            if (!cancelled) setStatus('invalid');
            return;
          }

          if (data.approval.status === 'approved') {
            if (!cancelled) setStatus('used');
          } else if (data.approval.status === 'pending') {
            if (!cancelled) setStatus('valid');
          } else {
            if (!cancelled) setStatus('invalid');
          }
        } catch (err) {
          console.error('[PARENTS_HQ] approval token validate failed:', err);
          if (!cancelled) setStatus('invalid');
        }
        return;
      }

      // If we have an inviteCode (child invite), validate it
      if (inviteCode) {
        setStatus('loading');
        try {
          const res = await fetch(`/api/invites/validate?code=${encodeURIComponent(inviteCode)}`, {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
          });
          const data = await res.json();

          if (!res.ok) {
            // Prefer explicit reason if present
            if (data?.reason === 'used') {
              if (!cancelled) setStatus('used');
            } else {
              if (!cancelled) setStatus('invalid');
            }
            return;
          }

          if (data?.valid) {
            if (!cancelled) setStatus('valid');
          } else if (data?.reason === 'used') {
            if (!cancelled) setStatus('used');
          } else {
            if (!cancelled) setStatus('invalid');
          }
        } catch (err) {
          console.error('[PARENTS_HQ] invite validate failed:', err);
          if (!cancelled) setStatus('invalid');
        }
        return;
      }

      // No approval token or invite code → show dashboard
      if (!cancelled) setStatus('valid');
    }

    validateRequest();
    return () => {
      cancelled = true;
    };
  }, [inviteCode, approvalToken]);

  // 3) Loading states
  if (authLoading || status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Checking your access…</p>
      </main>
    );
  }

  // 4) Error states (apply when inviteCode or approvalToken present)
  if ((inviteCode || approvalToken) && status === 'used') {
    return (
      <main className="min-h-screen flex items-center justify-center text-center text-gray-600">
        <div>
          <h1 className="text-xl font-bold text-green-600">
            {inviteCode ? 'Invite Already Used' : 'Approval Already Completed'}
          </h1>
          <p className="mt-2">
            {inviteCode 
              ? 'This invitation has already been accepted. You can manage your child\'s account from Parents HQ.'
              : 'This child approval has already been completed. You can manage your child\'s account from Parents HQ.'
            }
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={() => router.push('/parents/hq')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            >
              Go to Parents HQ
            </button>
            <button
              onClick={() => router.push('/my-cliqs-dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  if ((inviteCode || approvalToken) && status === 'invalid') {
    return (
      <main className="min-h-screen flex items-center justify-center text-center text-gray-600">
        <div>
          <h1 className="text-xl font-bold text-red-600">
            {inviteCode ? 'Invalid or Expired Invitation' : 'Invalid or Expired Approval Request'}
          </h1>
          <p className="mt-2">
            {inviteCode 
              ? 'This invite link is no longer valid. You can request a new invite from the sender.'
              : 'This approval request has expired. Please have your child resend the approval request.'
            }
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={() => router.push('/parents/hq')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            >
              Return to Parents HQ
            </button>
            <button
              onClick={() => router.push('/parents/hq/help')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Something went wrong?
            </button>
          </div>
        </div>
      </main>
    );
  }

  // 5) Happy paths
  if (approvalToken && status === 'valid') {
    // Child signup approval flow
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">⚡ Parents HQ</h1>
          <p className="text-gray-600">Child Signup Approval</p>
        </div>
        <ChildSignupApprovalFlow approvalToken={approvalToken} />
      </div>
    );
  }

  if (inviteCode && status === 'valid') {
    // Child invite approval flow
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">⚡ Parents HQ</h1>
          <p className="text-gray-600">Child Invite Approval</p>
        </div>
        <ChildSignupApprovalFlow inviteCode={inviteCode} />
      </div>
    );
  }

  // Default: Parent dashboard (ongoing child management)
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">⚡ Parents HQ</h1>
        <p className="text-gray-600 mt-2">Comprehensive child management and safety controls</p>
        <p className="text-sm text-blue-600">Every child on Cliqstr requires parent approval through this interface</p>
      </div>
      
      {/* Show pending approvals first */}
      <div className="mb-6">
        <PendingApprovalsSection />
      </div>
      
      {/* Show existing children management */}
      <div className="mb-6">
        <ExistingChildrenManagement />
      </div>
      
      {/* Show create new child option */}
      <div className="mb-6">
        <CreateNewChildSection />
      </div>
    </div>
  );
}
