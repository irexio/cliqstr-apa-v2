'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchJson } from '@/lib/fetchJson';

interface ParentLink {
  id: string;
  parentId: string;
  email: string;
  role: 'primary' | 'secondary' | 'guardian';
  permissions: {
    canManageChild: boolean;
    canChangeSettings: boolean;
    canViewActivity: boolean;
    receivesNotifications: boolean;
  };
  createdAt: number;
}

interface MultipleParentsManagerProps {
  childId: string;
  childName: string;
}

export default function MultipleParentsManager({ childId, childName }: MultipleParentsManagerProps) {
  const [parents, setParents] = useState<ParentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Add parent form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newParentRole, setNewParentRole] = useState<'secondary' | 'guardian'>('secondary');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchParents();
  }, [childId]);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/parent/children/${childId}/parents`);
      if (response.ok) {
        const data = await response.json();
        setParents(data.parents || []);
      } else {
        setError('Failed to load parents');
      }
    } catch (err) {
      setError('Error loading parents');
    } finally {
      setLoading(false);
    }
  };

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentEmail.trim()) return;

    setAdding(true);
    setError('');
    
    try {
      const response = await fetch('/api/parent/children/add-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          parentEmail: newParentEmail.trim(),
          role: newParentRole,
          permissions: {
            canManageChild: newParentRole === 'secondary',
            canChangeSettings: false,
            canViewActivity: true,
            receivesNotifications: true,
          }
        }),
      });

      if (response.ok) {
        setSuccess('Parent invitation sent successfully');
        setNewParentEmail('');
        setShowAddForm(false);
        fetchParents(); // Refresh the list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send invitation');
      }
    } catch (err) {
      setError('Error sending invitation');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveParent = async (parentId: string) => {
    if (!confirm('Are you sure you want to remove this parent?')) return;

    try {
      const response = await fetch('/api/parent/children/remove-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, parentId }),
      });

      if (response.ok) {
        setSuccess('Parent removed successfully');
        fetchParents(); // Refresh the list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to remove parent');
      }
    } catch (err) {
      setError('Error removing parent');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'primary': return 'bg-blue-100 text-blue-800';
      case 'secondary': return 'bg-green-100 text-green-800';
      case 'guardian': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-4">Loading parents...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Parents & Guardians for {childName}</span>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            variant="outline"
            size="sm"
          >
            Add Parent/Guardian
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded">
            {success}
          </div>
        )}

        {/* Add Parent Form */}
        {showAddForm && (
          <form onSubmit={handleAddParent} className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium">Add Additional Parent/Guardian</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentEmail">Email Address</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={newParentEmail}
                  onChange={(e) => setNewParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="parentRole">Role</Label>
                <Select value={newParentRole} onValueChange={(value: 'secondary' | 'guardian') => setNewParentRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="secondary">Secondary Parent</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={adding}>
                {adding ? 'Sending...' : 'Send Invitation'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Parents List */}
        <div className="space-y-3">
          {parents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No additional parents or guardians added yet.</p>
          ) : (
            parents.map((parent) => (
              <div key={parent.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{parent.email}</div>
                    <div className="text-sm text-gray-500">
                      {parent.permissions.canManageChild && 'Can manage child • '}
                      {parent.permissions.canViewActivity && 'Can view activity • '}
                      {parent.permissions.receivesNotifications && 'Receives notifications'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleBadgeColor(parent.role)}>
                    {parent.role.charAt(0).toUpperCase() + parent.role.slice(1)}
                  </Badge>
                  {parent.role !== 'primary' && (
                    <Button
                      onClick={() => handleRemoveParent(parent.parentId)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Parent Roles Explained</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Primary Parent:</strong> Full control over child's account and settings</li>
            <li><strong>Secondary Parent:</strong> Can manage child and view activity, limited settings access</li>
            <li><strong>Guardian:</strong> Can view activity and receive notifications, no management access</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
