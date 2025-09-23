'use client';

// 🔐 APA-HARDENED by Aiden — Do not remove or replace without APA review.
// This form renders the current subscription plan options for Cliqstr users.
// Updated with new plan structure for simplified testing and deployment.

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import BaseCard from '@/components/cliqs/BaseCard';

// TEMPORARY: Only showing Test Plan during pre-Stripe beta phase
// Force hardcode the plan to ensure it always displays
const PLANS = [
  { key: 'test', label: 'Test Plan', price: '$0', period: 'mo', recommended: false, features: ['Up to 2 cliqs', '10 posts per cliq', 'Posts auto-expire after 30 days'] }
];

// Note for users about temporary configuration
const TESTING_NOTE = "⚠️ This is a temporary testing configuration. Full plan options will be available after Stripe integration.";

console.log('Plans initialized:', PLANS);

// Commented out plans for future use after Stripe integration
/*
const ALL_PLANS = [
  { key: 'test', label: 'Test Plan', price: '$0', period: 'mo', recommended: false, features: ['Up to 2 cliqs', '10 posts per cliq', 'Posts auto-expire after 30 days'] },
  { key: 'basic', label: 'Basic Plan', price: '$5', period: 'mo', recommended: true, features: ['5 cliqs', '25 posts per cliq', 'Auto-expire after 90 days'] },
  { key: 'premium', label: 'Premium Plan', price: '$10', period: 'mo', recommended: false, features: ['10 cliqs', '50 posts per cliq', '1 GB storage'] },
  { key: 'family', label: 'Family Plan', price: '$12', period: 'mo', recommended: false, features: ['3–5 users shared', '25 posts per cliq', '500 MB storage'] },
  { key: 'group', label: 'Group/Org', price: '$25+', period: 'mo', recommended: false, features: ['50 cliqs', '100 posts per cliq', '5 GB+ storage'] }
];
*/

export default function ChoosePlanForm() {
  // Default to test plan during pre-Stripe beta phase
  const [selectedPlan, setSelectedPlan] = useState('test');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [approvalToken, setApprovalToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for approval token in URL
  useEffect(() => {
    const token = searchParams.get('approvalToken');
    console.log('[PARENT-APPROVAL] Checking for approval token in URL params:', searchParams.toString());
    console.log('[PARENT-APPROVAL] Found approval token:', token);
    if (token) {
      setApprovalToken(token);
      console.log('[PARENT-APPROVAL] Set approval token state:', token);
    } else {
      console.log('[PARENT-APPROVAL] No approval token found in URL');
    }
  }, [searchParams]);

  const savePlanToProfile = async (planKey: string) => {
    try {
      console.log(`Saving plan selection: ${planKey}`);
      
      // If this is a parent approval flow, use the special endpoint
      if (approvalToken) {
        console.log('[PARENT-APPROVAL] Using parent approval plan endpoint');
        const response = await fetch('/api/parent-approval/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            approvalToken: approvalToken,
            plan: planKey 
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save plan');
        }

        const result = await response.json();
        return { success: true, ...result };
      } else {
        // Regular plan selection for existing users
        const response = await fetch('/api/user/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ plan: planKey }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save plan');
        }

        const result = await response.json();
        return { success: true, ...result };
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      return { success: false, error };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage(null);

    try {
      console.log(`Submitting plan selection: ${selectedPlan}`);
      const result = await savePlanToProfile(selectedPlan);
      if (!result.success) throw new Error('Failed to save plan selection');
      console.log('Plan saved successfully:', result);

      // Check session status after plan selection
      try {
        const statusResponse = await fetch('/api/auth/status', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('[APA] Session status after plan selection:', statusData?.user?.account?.plan);
        }
      } catch (statusErr) {
        console.error('Session status check error:', statusErr);
      }

      // 🛠️ SOL'S FIX: Clear invite role data after successful plan selection
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('adultInviteContext');
          sessionStorage.removeItem('parentInviteContext');
          sessionStorage.removeItem('manualInviteContext');
          sessionStorage.removeItem('inviteRole');
          localStorage.removeItem('inviteRole');
          console.log('[APA] Cleared invite role data after successful plan selection');
        } catch (error) {
          console.error('[APA] Error clearing invite data:', error);
        }
      }

      // Show success message for any plan
      setStatus('success');
      
      // Determine redirect based on user role, not approval token
      // Check if this is a parent (either from approval flow or regular parent signup)
      const isParent = result.user?.role === 'Parent' || approvalToken;
      
      if (isParent) {
        setMessage(`${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan activated! Redirecting to Parents HQ...`);
        
        // Redirect to Parents HQ for parents (no refresh to avoid flash)
        setTimeout(() => {
          console.log('[PARENT] Redirecting to Parents HQ');
          if (approvalToken) {
            // For parent approval flow, go directly to child creation
            router.push(`/parents/hq?approvalToken=${encodeURIComponent(approvalToken)}`);
          } else {
            router.push('/parents/hq/dashboard');
          }
        }, 2000);
      } else {
        setMessage(`${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan activated! Redirecting to your dashboard...`);
        
        // For adults, redirect to My Cliqs dashboard (no refresh to avoid flash)
        setTimeout(() => {
          console.log('[ADULT] Redirecting to My Cliqs dashboard');
          router.push('/my-cliqs-dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('Plan selection error:', err);
      
      // For critical errors, redirect to help page
      if (approvalToken) {
        router.push('/parents/hq/help');
      } else {
        setStatus('error');
        setMessage('Something went wrong while saving your plan. Please try again.');
      }
    }
  };

  // If no plans are available, show a message
  if (!PLANS || PLANS.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-700 mb-4">No plans are currently available. Please try again later.</p>
        <button
          onClick={() => router.refresh()}
          className="py-2 px-4 bg-black text-white rounded hover:bg-gray-800"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  console.log('Available plans:', PLANS);

  return (
    <div className="w-full mx-auto px-2 sm:px-0">
      {/* Testing Configuration Note */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
        <p className="text-sm text-yellow-800">{TESTING_NOTE}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="w-full">
      <div className="flex justify-center mb-6 sm:mb-8">
        {PLANS.map((plan) => (
          <div key={plan.key} className="relative w-full max-w-md">
            <BaseCard
              onClick={() => setSelectedPlan(plan.key)}
              className={cn(
                'h-full transition-all hover:translate-y-[-2px]',
                selectedPlan === plan.key && 'ring-2 ring-black',
                plan.recommended && 'ring-1 ring-gray-400 bg-gray-50'
              )}
            >
              {plan.recommended && (
                <span className="absolute -top-2 left-4 bg-gray-800 text-white text-xs px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <div className="mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-semibold">{plan.label}</h3>
                <div className="mt-1 flex items-baseline">
                  <span className="text-xl sm:text-2xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 ml-1 text-sm sm:text-base">/{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-1 sm:space-y-2 mb-4 sm:mb-6 text-sm sm:text-base">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-black mr-2">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setSelectedPlan(plan.key)}
                className={cn(
                  'w-full mt-auto py-2.5 sm:py-3 rounded transition-colors text-sm sm:text-base',
                  'bg-black text-white hover:bg-gray-800',
                  selectedPlan === plan.key && 'bg-black',
                  selectedPlan !== plan.key && 'bg-gray-800'
                )}
              >
                Choose Plan
              </button>
            </BaseCard>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full max-w-md mx-auto block py-3 px-6 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-70 transition-colors text-sm sm:text-base font-medium"
      >
        {status === 'loading' ? 'Processing...' : 'Confirm Selection'}
      </button>

      {message && status === 'success' && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded text-center">
          <p className="text-sm text-gray-800">{message}</p>
          <div className="mt-2">
            <div className="inline-block w-4 h-4 border-2 border-t-black border-r-black border-gray-300 rounded-full animate-spin"></div>
            <span className="ml-2 text-xs text-gray-600">Redirecting to dashboard...</span>
          </div>
        </div>
      )}

      {message && status === 'error' && (
        <p className="text-sm text-red-600 text-center mt-4">
          {message}
        </p>
      )}
      </form>
    </div>
  );
}
