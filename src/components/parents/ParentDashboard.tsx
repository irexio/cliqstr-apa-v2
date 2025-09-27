/**
 * 🛡️ PARENT HQ - Main Parent Dashboard
 *
 * Purpose:
 *   - THE Parent HQ for managing ALL children (invited + directly created)
 *   - Comprehensive child permission management interface
 *   - Accessible to parents from their account for ongoing management
 *   - Handles both invite approval AND ongoing child management
 *
 * Features:
 *   - Create new child accounts
 *   - Manage existing children permissions
 *   - Handle child invite approvals
 *   - Update child credentials
 *   - Set all child safety permissions
 *
 * Used In:
 *   - /parents/hq/page.tsx - Main Parent HQ access point
 *   - Any parent needing child management tools
 *
 * Requirements:
 *   - Logged-in user must be a verified parent
 *   - ALL children on Cliqstr require parent approval through this interface
 */

'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/fetchJson';
import ChildPermissionManager from './ChildPermissionManager';
import MultipleParentsManager from './MultipleParentsManager';
import ChildActivityLogs from './ChildActivityLogs';
import LiveCliqMonitoring from './LiveCliqMonitoring';


// 🧠 Local definition of child structure
interface Child {
  id: string;
  name?: string;
  email?: string;
}

interface ParentDashboardProps {
  hideCreateForm?: boolean; // Hide the create form when in approval flow
}

export default function ParentDashboard({ hideCreateForm = false }: ParentDashboardProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', password: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchChildren = async () => {
      const res = await fetchJson('/api/parent/children');
      setChildren(res);
      if (res.length) setSelectedChildId(res[0].id);
    };
    fetchChildren();
  }, []);

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      // Create child via canonical endpoint
      const newChild = await fetchJson('/api/parent/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: createForm.username,
          password: createForm.password,
        }),
      });

      // Refresh list and select the new child
      const refreshed = await fetchJson('/api/parent/children');
      setChildren(refreshed);

      if (newChild?.id) {
        setSelectedChildId(newChild.id);
      }

      // Reset form
      setCreateForm({ username: '', password: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('[PARENT/CHILDREN] create failed', error);
      alert('Failed to create child account. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Create Child Account Section - Only show if not in approval flow */}
      {!hideCreateForm && (
        <div className="border border-black rounded p-4 bg-black text-white">
          <h3 className="font-semibold mb-2 text-white">Create New Child Account</h3>
        
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-900"
          >
            + Create Child Account
          </button>
        ) : (
          <form onSubmit={handleCreateChild} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Username:</label>
              <input
                type="text"
                value={createForm.username}
                onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                className="border rounded px-3 py-2 w-full max-w-xs"
                required
                minLength={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password:</label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                className="border rounded px-3 py-2 w-full max-w-xs"
                required
                minLength={6}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-900 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Account'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({ username: '', password: '' });
                }}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-900"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        </div>
      )}

      {/* Existing Children Section */}
      {children.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Manage Existing Children</h3>
          <select
            value={selectedChildId ?? ''}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="mb-4 border p-2 rounded"
          >
            <option value="">Select a child...</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name || child.email}
              </option>
            ))}
          </select>
        </div>
      )}

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
    </div>
  );
}
