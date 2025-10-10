/**
 * 🛡️ UNIFIED PARENT HQ - Single Dashboard Component
 *
 * Purpose:
 *   - UNIFIED Parent HQ for ALL parent functionality
 *   - Switches between "setup" mode (child approval) and "manage" mode (ongoing management)
 *   - Single consistent interface regardless of entry point
 *   - Handles both child invite approval AND ongoing child management
 *
 * Features:
 *   - Setup Mode: Child signup approval flow with ChildSignupApprovalFlow
 *   - Manage Mode: Existing children management with permissions, monitoring, etc.
 *   - Automatic mode switching based on context prop
 *   - Consistent layout and navigation
 *
 * Used In:
 *   - /parents/hq/page.tsx - Main Parent HQ access point (unified)
 *   - All parent approval flows (invites, direct signups)
 *   - Ongoing parent management access
 *
 * Requirements:
 *   - Logged-in user must be a verified parent
 *   - ALL children on Cliqstr require parent approval through this interface
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchJson } from '@/lib/fetchJson';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import ChildPermissionManager from './ChildPermissionManager';
import MultipleParentsManager from './MultipleParentsManager';
import ChildActivityLogs from './ChildActivityLogs';
import LiveCliqMonitoring from './LiveCliqMonitoring';
import PendingApprovalsSection from './PendingApprovalsSection';
import ChildSignupApprovalFlow from './ChildSignupApprovalFlow';

// 🧠 Local definition of child structure
interface Child {
  id: string;
  name?: string;
  email?: string;
}

interface ApprovalDetails {
  childFirstName: string;
  childLastName: string;
  childBirthdate: string;
  parentEmail: string;
  context: string;
}

interface ParentDashboardProps {
  context: 'setup' | 'manage';
  approvalToken?: string | null;
  inviteCode?: string | null;
}

export default function ParentDashboard({ context, approvalToken, inviteCode }: ParentDashboardProps) {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [setupApproval, setSetupApproval] = useState<ApprovalDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Check parent's current state and route accordingly
  const checkParentStateAndRoute = async (parentEmail: string, inviteCode: string) => {
    try {
      // Check if user is currently signed in
      const authResponse = await fetch('/api/auth/status');
      if (authResponse.ok) {
        const { user } = await authResponse.json();
        
        if (user?.account?.role === 'Parent') {
          // Existing parent - continue to setup
          console.log('[PARENT_DASHBOARD] Existing parent, continuing to setup');
          return;
        } else if (user?.account?.role === 'Adult') {
          // Existing adult - redirect to sign-in with auto-upgrade
          console.log('[PARENT_DASHBOARD] Existing adult, redirecting to sign-in for upgrade');
          router.push(`/sign-in?approvalToken=${encodeURIComponent(approvalToken || '')}`);
          return;
        }
      }

      // No user signed in - check if parent account exists
      const checkUserResponse = await fetch(`/api/auth/check-user?email=${encodeURIComponent(parentEmail)}`);
      if (checkUserResponse.ok) {
        const { exists, role } = await checkUserResponse.json();

        if (exists && role === 'Parent') {
          // Parent account exists - redirect to sign-in
          console.log('[PARENT_DASHBOARD] Parent account exists, redirecting to sign-in');
          router.push(`/sign-in?approvalToken=${encodeURIComponent(approvalToken || '')}`);
          return;
        } else if (exists && role === 'Adult') {
          // Adult account exists - redirect to sign-in with auto-upgrade
          console.log('[PARENT_DASHBOARD] Adult account exists, redirecting to sign-in for upgrade');
          router.push(`/sign-in?approvalToken=${encodeURIComponent(approvalToken || '')}`);
          return;
        }
      }
      
      // No account exists - redirect to parent signup
      console.log('[PARENT_DASHBOARD] No account exists, redirecting to parent signup');
      router.push(`/parent-approval?token=${encodeURIComponent(approvalToken || '')}`);
      
    } catch (error) {
      console.error('[PARENT_DASHBOARD] Error checking parent state:', error);
      // On error, continue to setup (fallback)
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      if (context === 'setup' && (approvalToken || inviteCode)) {
        // Setup mode: Load approval details
        try {
          if (approvalToken) {
            // Use approval check API for both direct signups and child invites
            const res = await fetch(`/api/parent-approval/check?token=${encodeURIComponent(approvalToken)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.approval) {
                // Check parent's current state and route accordingly
                await checkParentStateAndRoute(data.approval.parentEmail, approvalToken);

                setSetupApproval(data.approval);
              } else {
                console.error('[PARENT_DASHBOARD] No approval data in response');
                router.push('/parents/hq'); // fallback to manage mode
              }
            } else {
              console.error('[PARENT_DASHBOARD] Invalid approval token');
              router.push('/parents/hq'); // fallback to manage mode
            }
          } else if (inviteCode) {
            // Legacy support: if only inviteCode is provided, treat it as approvalToken
            const res = await fetch(`/api/parent-approval/check?token=${encodeURIComponent(inviteCode)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.approval) {
                await checkParentStateAndRoute(data.approval.parentEmail, inviteCode);
                setSetupApproval(data.approval);
              } else {
                console.error('[PARENT_DASHBOARD] No approval data in response');
                router.push('/parents/hq');
              }
            } else {
              console.error('[PARENT_DASHBOARD] Invalid invite code');
              router.push('/parents/hq');
            }
          }
        } catch (error) {
          console.error('[PARENT_DASHBOARD] Failed to load approval details:', error);
          router.push('/parents/hq'); // fallback to manage mode
        }
      } else {
        // Manage mode: Load existing children
        try {
          const res = await fetchJson('/api/parent/children');
          setChildren(res);
          if (res.length) setSelectedChildId(res[0].id);
        } catch (error) {
          console.error('[PARENT_DASHBOARD] Failed to load children:', error);
        }
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [context, approvalToken, inviteCode, router]);

  const handleChildCreated = (childName?: string) => {
    // After successful child creation, redirect to success page
    const successUrl = childName 
      ? `/parents/hq/success?childName=${encodeURIComponent(childName)}`
      : '/parents/hq/success';
    router.push(successUrl);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        <p className="ml-3 text-gray-600">Loading Parents HQ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Different for setup vs manage */}
      {context === 'setup' ? (
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">⚡ Parents HQ</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Set up your child's Cliqstr account</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">⚡ Parents HQ</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your children's accounts and permissions</p>
          </div>
          <Button
            onClick={() => router.push('/parents/hq/setup')}
            className="mt-3 sm:mt-0 bg-black text-white hover:bg-gray-800"
          >
            + Add New Child
          </Button>
        </div>
      )}

      {/* Setup Mode Content */}
      {context === 'setup' && (
        <>
          {/* Setup Mode Indicator */}
          <div className="bg-blue-100 border-l-4 border-blue-500 p-3 sm:p-4">
            <p className="text-blue-800 font-semibold text-sm sm:text-base">
              🔧 Setting up child account
            </p>
            <p className="text-blue-700 text-xs sm:text-sm mt-1">
              Complete the setup process below. After completion, you'll return to the main dashboard.
            </p>
          </div>

          {/* Setup Content */}
          <ChildSignupApprovalFlow
            approvalToken={approvalToken || undefined}
            inviteCode={inviteCode || undefined}
            onChildCreated={handleChildCreated}
            mode="create"
          />
        </>
      )}

      {/* Manage Mode Content */}
      {context === 'manage' && (
        <>
          {/* Pending Approvals Section */}
          <PendingApprovalsSection />

          {/* Child Management Interface */}
          {children.length > 0 ? (
            <>
              {/* Child Selector */}
              <div className="border border-gray-300 rounded-lg p-4 bg-white">
                <label htmlFor="childSelector" className="block text-sm font-semibold mb-2">
                  Select Child to Manage
                </label>
                <Select
                  value={selectedChildId ?? ''}
                  onValueChange={(value) => setSelectedChildId(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name || child.email || `Child ${child.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Child Management Tools */}
              {selectedChildId && (
                <>
                  <ChildPermissionManager childId={selectedChildId} />
                  <MultipleParentsManager
                    childId={selectedChildId}
                    childName={children.find(c => c.id === selectedChildId)?.name || 'Child'}
                  />
                  <ChildActivityLogs
                    childId={selectedChildId}
                    childName={children.find(c => c.id === selectedChildId)?.name || 'Child'}
                  />
                  <LiveCliqMonitoring
                    childId={selectedChildId}
                    childName={children.find(c => c.id === selectedChildId)?.name || 'Child'}
                  />
                </>
              )}
            </>
          ) : (
            /* No Children State */
            <div className="text-center py-8">
              <div className="bg-gray-100 rounded-lg p-8 max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Children Yet</h3>
                <p className="text-gray-600 mb-4">
                  Get started by creating your first child account or approving a child invitation.
                </p>
                <Button
                  onClick={() => router.push('/parents/hq/setup')}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  + Create Your First Child Account
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
