'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * PlanGuard - Client-side plan validation component
 * 
 * This component provides an additional layer of security by checking
 * the user's plan status on the client side. It should be used as a
 * backup to server-side validation.
 * 
 * Usage: Add this component to any page that requires a plan
 */
export default function PlanGuard({ children }: { children: React.ReactNode }) {
  const [isValidating, setIsValidating] = useState(true);
  const [hasValidPlan, setHasValidPlan] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const validatePlan = async () => {
      try {
        const response = await fetch('/api/auth/status', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });

        if (!response.ok) {
          console.log('[PLAN-GUARD] Auth check failed, redirecting to sign-in');
          router.push('/sign-in');
          return;
        }

        const data = await response.json();
        const user = data.user;

        if (!user) {
          console.log('[PLAN-GUARD] No user found, redirecting to sign-in');
          router.push('/sign-in');
          return;
        }

        // Check if user has a valid plan
        const plan = user.account?.plan || user.plan;
        const hasPlan = plan && plan !== null && plan !== '';

        console.log('[PLAN-GUARD] Plan validation:', {
          plan,
          hasPlan,
          role: user.account?.role,
          approved: user.account?.isApproved
        });

        if (!hasPlan) {
          console.log('[PLAN-GUARD] User has no plan, redirecting to choose-plan');
          router.push('/choose-plan');
          return;
        }

        // User has valid plan
        setHasValidPlan(true);
        console.log('[PLAN-GUARD] User has valid plan, allowing access');

      } catch (error) {
        console.error('[PLAN-GUARD] Error validating plan:', error);
        router.push('/sign-in');
      } finally {
        setIsValidating(false);
      }
    };

    validatePlan();
  }, [router]);

  // Show loading while validating
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Validating access...</p>
        </div>
      </div>
    );
  }

  // Only render children if user has valid plan
  if (!hasValidPlan) {
    return null; // Will redirect, so don't render anything
  }

  return <>{children}</>;
}
