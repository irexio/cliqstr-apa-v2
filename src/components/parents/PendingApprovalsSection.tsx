'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PendingApproval {
  _id: string;
  childFirstName: string;
  childLastName: string;
  childBirthdate: string;
  parentEmail: string;
  approvalToken: string;
  status: 'pending' | 'approved' | 'declined' | 'expired';
  context: 'direct_signup' | 'child_invite';
  inviteId?: string;
  cliqId?: string;
  inviterName?: string;
  cliqName?: string;
  parentState: 'new' | 'existing_parent' | 'existing_adult';
  existingParentId?: string;
  createdAt: number;
  expiresAt: number;
  approvedAt?: number;
  declinedAt?: number;
}

export default function PendingApprovalsSection() {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        console.log('[PendingApprovalsSection] Fetching pending approvals...');
        const response = await fetch('/api/parent/pending-approvals');
        console.log('[PendingApprovalsSection] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[PendingApprovalsSection] Received data:', data);
          setPendingApprovals(data.pendingApprovals || []);
        } else {
          console.error('[PendingApprovalsSection] API error:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('[PendingApprovalsSection] Failed to fetch pending approvals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingApprovals();
  }, []);

  const handleResumeApproval = (approval: PendingApproval) => {
    // Navigate to the approval flow with the token
    router.push(`/parent-approval?token=${approval.approvalToken}`);
  };

  const handleDeclineApproval = async (approval: PendingApproval) => {
    if (!confirm(`Are you sure you want to decline the invitation for ${approval.childFirstName} ${approval.childLastName}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/parent-approval/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalToken: approval.approvalToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Invitation declined successfully');
        // Refresh the page to update the pending approvals list
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to decline invitation: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to decline approval:', error);
      alert('Failed to decline invitation. Please try again.');
    }
  };

  const formatExpiryTime = (expiresAt: number) => {
    const now = Date.now();
    const timeLeft = expiresAt - now;
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else if (minutes > 0) {
      return `${minutes}m left`;
    } else {
      return 'Expired';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (pendingApprovals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">⚠️ Pending Child Approvals</h2>
          <span className="text-sm text-gray-500">0 pending</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          No pending child approvals at this time.
        </p>
        
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">
            When you receive child approval requests, they will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">⚠️ Pending Child Approvals</h2>
        <span className="text-sm text-gray-500">{pendingApprovals.length} pending</span>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        You have incomplete child account approvals that need your attention.
      </p>

      <div className="space-y-3">
        {pendingApprovals.map((approval) => (
          <div key={approval._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-medium text-gray-900">
                    {approval.childFirstName} {approval.childLastName}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {approval.context === 'child_invite' ? 'Invite' : 'Signup'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  {approval.context === 'child_invite' && approval.inviterName && (
                    <p>Invited by: <span className="font-medium">{approval.inviterName}</span></p>
                  )}
                  {approval.cliqName && (
                    <p>Joining cliq: <span className="font-medium">{approval.cliqName}</span></p>
                  )}
                  <p>Expires: <span className="font-medium">{formatExpiryTime(approval.expiresAt)}</span></p>
                </div>
              </div>
              
              <div className="ml-4 flex gap-2">
                <button
                  onClick={() => handleResumeApproval(approval)}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Resume Approval
                </button>
                <button
                  onClick={() => handleDeclineApproval(approval)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> These approvals will expire if not completed. 
          Click "Resume Approval" to continue where you left off.
        </p>
      </div>
    </div>
  );
}
