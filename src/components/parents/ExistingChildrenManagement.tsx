'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchJson } from '@/lib/fetchJson';
import ChildSignupApprovalFlow from './ChildSignupApprovalFlow';

interface Child {
  id: string;
  name?: string;
  email?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    birthdate?: string;
  };
}

export default function ExistingChildrenManagement() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        console.log('[ExistingChildrenManagement] Fetching children...');
        const res = await fetchJson('/api/parent/children');
        console.log('[ExistingChildrenManagement] Received children:', res);
        setChildren(res);
        if (res.length > 0) {
          setSelectedChildId(res[0].id);
        }
      } catch (error) {
        console.error('[ExistingChildrenManagement] Failed to fetch children:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">👨‍👩‍👧‍👦 Manage Existing Children</h2>
          <span className="text-sm text-gray-500">0 children</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          No children have been added to your account yet.
        </p>
        
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">
            Once you create child accounts or approve child invitations, they will appear here for management.
          </p>
        </div>
      </div>
    );
  }

  const selectedChild = children.find(c => c.id === selectedChildId);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">👨‍👩‍👧‍👦 Manage Existing Children</h2>
        <span className="text-sm text-gray-500">{children.length} child{children.length !== 1 ? 'ren' : ''}</span>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select a child to manage:
        </label>
        <select
          value={selectedChildId || ''}
          onChange={(e) => setSelectedChildId(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose a child...</option>
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.profile?.firstName && child.profile?.lastName 
                ? `${child.profile.firstName} ${child.profile.lastName}`
                : child.name || child.email || 'Unknown Child'
              }
            </option>
          ))}
        </select>
      </div>

      {selectedChild && (
        <div className="mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-900 mb-2">
              Managing: {selectedChild.profile?.firstName && selectedChild.profile?.lastName 
                ? `${selectedChild.profile.firstName} ${selectedChild.profile.lastName}`
                : selectedChild.name || selectedChild.email || 'Unknown Child'
              }
            </h3>
            <p className="text-sm text-blue-700">
              Use the full Parents HQ interface below to manage permissions, settings, and safety controls for this child.
            </p>
          </div>
          
          {/* Show the full Parents HQ interface for this child */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-4">⚡ Parents HQ - Child Management</h4>
            <p className="text-sm text-gray-600 mb-4">
              This is the same interface used for new child approvals. You can modify permissions, 
              update settings, and manage safety controls for your existing child.
            </p>
            
            {/* For now, show a placeholder - we'll need to create a management version of ChildSignupApprovalFlow */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Child Management Interface</h3>
                <p className="text-gray-600 mb-4">
                  Full permission management interface for {selectedChild.profile?.firstName || 'this child'}
                </p>
                <button
                  onClick={() => {
                    // TODO: Open the full management interface
                    alert('Full child management interface coming soon!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open Full Management Interface
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
