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
  const [resuming, setResuming] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    checkParentProgress();
  }, [token]);

  const checkParentProgress = async () => {
    let approval = null;
    
    try {
      setLoading(true);
      setError(null);
      
      // Step 1: Check approval status (only if token provided)
      if (token) {
        // First try to get approval by token (for direct signups)
        const approvalResponse = await fetch(`/api/parent-approval/check?token=${encodeURIComponent(token)}`);
        const approvalData = await approvalResponse.json();

        if (approvalResponse.ok && approvalData.approval) {
          approval = approvalData.approval;
          console.log('[SMART-ROUTER] Found approval record, status:', approval.status);
        } else {
          // If not found in approvals, try to get invite details (for child invites)
          console.log('[SMART-ROUTER] No approval found, checking if token is invite code...');
          console.log('[SMART-ROUTER] Validating invite code:', token);
          const inviteResponse = await fetch(`/api/invites/validate?code=${encodeURIComponent(token)}`);
          const inviteData = await inviteResponse.json();
          
          console.log('[SMART-ROUTER] Invite validation response:', {
            ok: inviteResponse.ok,
            status: inviteResponse.status,
            data: inviteData
          });
          
          if (inviteResponse.ok && inviteData.valid) {
            // Convert invite data to approval format for consistency
            approval = {
              childFirstName: inviteData.friendFirstName || 'Child',
              childLastName: inviteData.friendLastName || '',
              childBirthdate: inviteData.childBirthdate || '',
              parentEmail: inviteData.recipientEmail || '',
              status: 'pending',
              context: 'child_invite',
              inviteCode: token, // Store the original invite code
            };
            console.log('[SMART-ROUTER] Found invite record, converted to approval format');
          } else {
            setError('Invalid or expired token');
            setLoading(false);
            return;
          }
        }
      } else {
        // Fallback for sign-in resume
        const parentResponse = await fetch('/api/auth/status');
        if (parentResponse.ok) {
          const { user } = await parentResponse.json();
          if (user?.account?.role === 'Parent') {
            // Show resuming message for a moment
            setResuming(true);
            setLoading(false);
            
            // Small delay to show the resuming message
            setTimeout(() => {
              // Decide route based on setupStage
              switch (user.account.setupStage) {
                case 'started':
                  router.push('/choose-plan');
                  return;
                case 'plan_selected':
                case 'child_pending':
                  router.push('/parents/hq?resume=true');
                  return;
                default:
                  router.push('/parents/hq');
                  return;
              }
            }, 1000);
            return;
          }
        }
        setError('Unable to detect approval state');
        setLoading(false);
        return;
      }

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
            childExists = childrenData?.some((child: any) => 
              `${child.firstName} ${child.lastName}` === childName
            );
            console.log('[SMART-ROUTER] Found children:', childrenData?.length || 0);
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

      if (token && approval) {
        // Token-based flow (from email) - ALWAYS FOLLOW THE 3-STEP FLOW
        if (approval.context === 'child_invite') {
          // CHILD INVITE FLOW: Check if parent exists and their role
          if (!parentAccount) {
            // NEW PARENT: Parent Sign Up → Plan Page → PHQ
            if (approval.status === 'pending') {
              // Step 1: Parent Sign Up
              redirectUrl = `/parent-approval?token=${encodeURIComponent(token)}`;
              stepDescription = 'Create your parent account';
            } else if (approval.status === 'approved' && !hasPlan) {
              // Step 2: Plan Page
              redirectUrl = `/choose-plan?approvalToken=${encodeURIComponent(token)}`;
              stepDescription = 'Select your plan';
            } else {
              // Step 3: Parents HQ
              redirectUrl = `/parents/hq?approvalToken=${encodeURIComponent(token)}`;
              stepDescription = 'Complete child setup in Parents HQ';
            }
          } else if (parentAccount && parentAccount.role === 'Parent') {
            // EXISTING PARENT: Go directly to PHQ
            redirectUrl = `/parents/hq?approvalToken=${encodeURIComponent(token)}`;
            stepDescription = 'Complete child setup in Parents HQ';
          } else if (approval.parentState === 'existing_adult') {
            // EXISTING ADULT: Sign In → Upgrade to Parent → Plan Page → PHQ
            if (approval.status === 'pending') {
              // Step 1: Sign In (existing adult needs to sign in first)
              redirectUrl = `/sign-in?approvalToken=${encodeURIComponent(token)}`;
              stepDescription = 'Sign in to upgrade to parent account';
            } else if (approval.status === 'approved' && !hasPlan) {
              // Step 2: Plan Page
              redirectUrl = `/choose-plan?approvalToken=${encodeURIComponent(token)}`;
              stepDescription = 'Select your plan';
            } else {
              // Step 3: Parents HQ
              redirectUrl = `/parents/hq?approvalToken=${encodeURIComponent(token)}`;
              stepDescription = 'Complete child setup in Parents HQ';
            }
          } else {
            // Fallback: Go to Parents HQ
            redirectUrl = `/parents/hq?approvalToken=${encodeURIComponent(token)}`;
            stepDescription = 'Complete child setup in Parents HQ';
          }
        } else {
          // DIRECT SIGNUP FLOW: Check if parent has account first
          if (approval.status === 'pending' && !parentAccount) {
            // Step 1: Parent hasn't started - create account
            redirectUrl = `/parent-approval?token=${encodeURIComponent(token)}`;
            stepDescription = 'Create your parent account';
          } else if (approval.status === 'approved' && parentAccount && !hasPlan) {
            // Step 2: Parent has account but no plan - select plan
            redirectUrl = `/choose-plan?approvalToken=${encodeURIComponent(token)}`;
            stepDescription = 'Select your plan';
          } else {
            // Step 3+: Check if this specific child already exists
            if (childExists) {
              // Child already exists - go to manage mode
              redirectUrl = `/parents/hq`;
              stepDescription = 'Go to Parents HQ to manage existing child';
            } else {
              // Child doesn't exist - go to setup mode
              redirectUrl = `/parents/hq?approvalToken=${encodeURIComponent(token)}`;
              stepDescription = 'Complete child setup in Parents HQ';
            }
          }
        }
      } else {
        // Direct login flow (no token) - route based on setup stage
        if (!parentAccount) {
          // No parent account - redirect to sign up
          redirectUrl = '/sign-up';
          stepDescription = 'Create your account';
        } else if (parentAccount && !hasPlan) {
          // Parent has account but no plan - select plan
          redirectUrl = '/choose-plan';
          stepDescription = 'Select your plan';
        } else {
          // Everything else goes to unified Parents HQ
          redirectUrl = '/parents/hq';
          stepDescription = 'Go to Parents HQ';
        }
      }

      console.log('[SMART-ROUTER] Routing to:', redirectUrl, 'for step:', stepDescription);
      console.log('[SMART-ROUTER] Full routing details:', {
        token,
        approval,
        parentAccount: !!parentAccount,
        hasPlan,
        childExists,
        redirectUrl,
        stepDescription
      });

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
      console.error('[SMART-ROUTER] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        token,
        approval: approval || null
      });
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

  if (resuming) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">🔄 Resuming Setup</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Resuming your setup...</p>
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
