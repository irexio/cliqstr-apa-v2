'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Smart Parent Approval Router
 * 
 * This component intelligently routes parents to the correct step in the approval process
 * based on their current progress, preventing confusion and duplicate actions.
 */
export default function SmartParentApprovalRouter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<any>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('No approval token provided');
      setLoading(false);
      return;
    }

    checkParentProgress();
  }, [token]);

  const checkParentProgress = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Check approval status
      const approvalResponse = await fetch(`/api/parent-approval/check?token=${encodeURIComponent(token!)}`);
      const approvalData = await approvalResponse.json();

      if (!approvalResponse.ok || !approvalData.approval) {
        setError('Invalid or expired approval token');
        setLoading(false);
        return;
      }

      const approval = approvalData.approval;
      console.log('[SMART-ROUTER] Approval status:', approval.status);

      // Step 2: Check if parent account exists
      let parentAccount = null;
      try {
        const parentResponse = await fetch('/api/auth/status');
        if (parentResponse.ok) {
          const parentData = await parentResponse.json();
          parentAccount = parentData.user;
        }
      } catch (err) {
        // Parent not logged in - that's okay
      }

      console.log('[SMART-ROUTER] Parent account exists:', !!parentAccount);

      // Step 3: Check parent's plan if they have an account
      let hasPlan = false;
      if (parentAccount) {
        try {
          const planResponse = await fetch('/api/user/plan');
          if (planResponse.ok) {
            const planData = await planResponse.json();
            hasPlan = !!planData.plan;
          }
        } catch (err) {
          // Plan check failed - assume no plan
        }
      }

      console.log('[SMART-ROUTER] Parent has plan:', hasPlan);

      // Step 4: Check if child account exists
      let childExists = false;
      if (parentAccount && hasPlan) {
        try {
          const childrenResponse = await fetch('/api/parent/children');
          if (childrenResponse.ok) {
            const childrenData = await childrenResponse.json();
            // Check if child with matching name exists
            const childName = `${approval.childFirstName} ${approval.childLastName}`;
            childExists = childrenData.children?.some((child: any) => 
              `${child.firstName} ${child.lastName}` === childName
            );
            console.log('[SMART-ROUTER] Found children:', childrenData.children?.length || 0);
            console.log('[SMART-ROUTER] Looking for child:', childName);
            console.log('[SMART-ROUTER] Child exists:', childExists);
          }
        } catch (err) {
          console.log('[SMART-ROUTER] Children check failed:', err);
          // Children check failed - assume no child
        }
      }

      console.log('[SMART-ROUTER] Child account exists:', childExists);

      // Determine the correct route based on progress
      let redirectUrl = '';
      let stepDescription = '';

      if (approval.status === 'pending' && !parentAccount) {
        // Step 1: Parent hasn't started - create account
        redirectUrl = `/parent-approval?token=${encodeURIComponent(token!)}`;
        stepDescription = 'Create your parent account';
      } else if (approval.status === 'approved' && parentAccount && !hasPlan) {
        // Step 2: Parent has account but no plan - select plan
        redirectUrl = `/choose-plan?approvalToken=${encodeURIComponent(token!)}`;
        stepDescription = 'Select your plan';
      } else if (approval.status === 'approved' && parentAccount && hasPlan && !childExists) {
        // Step 3: Parent has plan but no child account - RESUME child setup
        redirectUrl = `/parents/hq?approvalToken=${encodeURIComponent(token!)}`;
        stepDescription = 'Resume setting up your child\'s account';
      } else if (approval.status === 'approved' && parentAccount && hasPlan && childExists) {
        // Step 4: Everything is done - success page
        redirectUrl = `/parents/hq/success?childName=${encodeURIComponent(approval.childFirstName)}`;
        stepDescription = 'Child account setup complete';
      } else {
        // Fallback - go to account creation
        redirectUrl = `/parent-approval?token=${encodeURIComponent(token!)}`;
        stepDescription = 'Create your parent account';
      }

      console.log('[SMART-ROUTER] Routing to:', redirectUrl, 'for step:', stepDescription);

      setProgress({
        approval,
        parentAccount: !!parentAccount,
        hasPlan,
        childExists,
        redirectUrl,
        stepDescription
      });

      // Redirect after a brief moment to show the user what's happening
      setTimeout(() => {
        router.push(redirectUrl);
      }, 1500);

    } catch (err) {
      console.error('[SMART-ROUTER] Error checking progress:', err);
      setError('Failed to check your progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">⚡ Smart Routing</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Checking your progress...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">⚠️ Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.href = '/sign-up'}
              className="w-full"
            >
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (progress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">⚡ Smart Routing</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Taking you to the right place</h3>
              <p className="text-gray-600 mb-4">{progress.stepDescription}</p>
            </div>
            
            <div className="text-sm text-gray-500 space-y-1">
              <p>✓ Approval token: Valid</p>
              <p>{progress.parentAccount ? '✓' : '○'} Parent account: {progress.parentAccount ? 'Created' : 'Not created'}</p>
              <p>{progress.hasPlan ? '✓' : '○'} Plan selected: {progress.hasPlan ? 'Yes' : 'No'}</p>
              <p>{progress.childExists ? '✓' : '○'} Child account: {progress.childExists ? 'Created' : 'Not created'}</p>
            </div>

            <div className="mt-4">
              <p className="text-sm text-blue-600">Redirecting automatically...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
