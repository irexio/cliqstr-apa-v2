'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateNewChildSection() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', password: '' });
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      // Create child via canonical endpoint
      const newChild = await fetch('/api/parent/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: createForm.username,
          password: createForm.password,
        }),
      });

      if (newChild.ok) {
        // Reset form
        setCreateForm({ username: '', password: '' });
        setShowCreateForm(false);
        
        // Refresh the page to show the new child
        window.location.reload();
      } else {
        const error = await newChild.json();
        alert(`Failed to create child account: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[PARENT/CHILDREN] create failed', error);
      alert('Failed to create child account. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">➕ Add New Child</h2>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Create a new child account and set up their permissions and safety controls.
      </p>

      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          + Create New Child Account
        </button>
      ) : (
        <form onSubmit={handleCreateChild} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username:</label>
            <input
              type="text"
              value={createForm.username}
              onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={3}
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={6}
              placeholder="Enter password"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create Child Account'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setCreateForm({ username: '', password: '' });
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
