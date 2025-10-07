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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      if (context === 'setup' && (approvalToken || inviteCode)) {
        // Setup mode: Load approval details
        try {
          const token = approvalToken || inviteCode;
          const res = await fetch(`/api/parent-approval/check?token=${encodeURIComponent(token!)}`);
          if (res.ok) {
            const data = await res.json();
            setSetupApproval(data.approval);
          } else {
            console.error('[PARENT_DASHBOARD] Invalid approval token');
            router.push('/parents/hq'); // fallback to manage mode
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

  const handleChildCreated = () => {
    // After successful child creation, switch to manage mode
    router.push('/parents/hq');
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
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">⚡ Parents HQ</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Comprehensive child management and safety controls</p>
        <p className="text-xs sm:text-sm text-blue-600 mt-1">Every child on Cliqstr requires parent approval through this interface</p>
      </div>

      {/* Mode Indicator */}
      {context === 'setup' && (
        <div className="bg-blue-100 border-l-4 border-blue-500 p-3 sm:p-4 mb-4">
          <p className="text-blue-800 font-semibold text-sm sm:text-base">
            🔧 Setup Mode: Creating new child account
          </p>
          <p className="text-blue-700 text-xs sm:text-sm mt-1">
            Complete the child approval process below. After setup, you'll be able to manage this child from the main dashboard.
          </p>
        </div>
      )}

      {context === 'setup' && setupApproval ? (
        /* Setup Mode: Child Signup Approval Flow */
        <div className="border p-3 sm:p-4 bg-blue-50 rounded-lg">
          <h2 className="text-base sm:text-lg font-semibold mb-2">
            Set Up Child Account for {setupApproval.childFirstName} {setupApproval.childLastName}
          </h2>
          <ChildSignupApprovalFlow 
            approvalToken={approvalToken || undefined}
            inviteCode={inviteCode || undefined}
            onChildCreated={handleChildCreated}
          />
        </div>
      ) : (
        /* Manage Mode: Existing Children Management */
        <>
          {/* Pending Approvals Section */}
          <PendingApprovalsSection />
          
          {/* Child Selector Dropdown - Show when parent has children */}
          {children.length > 0 && (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
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
          )}

          {/* Create New Child Section */}
          <div className="border border-black rounded p-4 bg-black text-white">
            <h3 className="font-semibold mb-2 text-white">+ Add New Child</h3>
            <p className="text-gray-300 text-sm mb-3">Create a new child account and set up their permissions and safety controls.</p>
            <button
              onClick={() => router.push('/parents/hq?create=true')}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-900 border border-white"
            >
              + Create New Child Account
            </button>
          </div>

          {/* Child Management Section - Shows when a child is selected */}
          {selectedChildId && (
            <>
              <ChildPermissionManager childId={selectedChildId} />
              <div className="mt-6">
                <MultipleParentsManager 
                  childId={selectedChildId} 
                  childName={children.find(c => c.id === selectedChildId)?.name || 'Child'} 
                />
              </div>
              <div className="mt-6">
                <ChildActivityLogs 
                  childId={selectedChildId} 
                  childName={children.find(c => c.id === selectedChildId)?.name || 'Child'} 
                />
              </div>
              <div className="mt-6">
                <LiveCliqMonitoring 
                  childId={selectedChildId} 
                  childName={children.find(c => c.id === selectedChildId)?.name || 'Child'} 
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
