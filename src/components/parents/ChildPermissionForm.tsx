'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PasswordInput from '@/components/ui/PasswordInput';

interface PermissionFormProps {
  childId?: string;
  mode?: 'create' | 'edit';
  approvalToken?: string;
  inviteCode?: string;
  onSuccess?: (childName: string, isNewChild: boolean) => void;
}

export default function ChildPermissionForm({
  childId,
  mode = 'create',
  approvalToken,
  inviteCode,
  onSuccess,
}: PermissionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === 'create' ? !!approvalToken || !!inviteCode : !!childId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Child info
  const [childFirstName, setChildFirstName] = useState('');
  const [childLastName, setChildLastName] = useState('');
  const [childBirthdate, setChildBirthdate] = useState('');
  const [childAge, setChildAge] = useState<number | null>(null);

  // Account fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [childEmail, setChildEmail] = useState('');
  const [secondParentEmail, setSecondParentEmail] = useState('');

  // Consent & Monitoring
  const [redAlertAccepted, setRedAlertAccepted] = useState(false);
  const [silentMonitoring, setSilentMonitoring] = useState(true);

  // Permissions
  const [permissions, setPermissions] = useState({
    // Activity & Content
    canCreateCliqs: false,
    canCreatePublicCliqs: false,
    canJoinPublicCliqs: true,
    canPost: true,
    canComment: true,
    canReact: true,
    canViewProfiles: true,
    canUploadVideos: false,
    
    // Receiving Invites
    canReceiveInvites: true,
    receiveInvitesRequireApproval: false, // false = auto-accept, true = parent must approve
    
    // Sending Invites to Children
    canSendInvitesToChildren: false,
    sendInvitesToChildrenRequireApproval: false,
    
    // Sending Invites to Adults
    canSendInvitesToAdults: false,
    sendInvitesToAdultsRequireApproval: false,
    
    // Sending Invites to Parents
    canSendInvitesToParents: false,
    sendInvitesToParentsRequireApproval: false,
  });

  // Fetch child data or approval details
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (mode === 'edit' && childId) {
          // Load existing child
          const response = await fetch(`/api/parent/children/${childId}`, { cache: 'no-store' });
          if (!response.ok) throw new Error('Failed to load child');
          const data = await response.json();
          
          setChildFirstName(data.child.firstName || '');
          setChildLastName(data.child.lastName || '');
          setChildBirthdate(data.child.birthdate || '');
          setUsername(data.child.username || '');
          setChildEmail(data.child.email || '');
          setSecondParentEmail(data.child.secondParentEmail || '');
          setSilentMonitoring(data.child.silentMonitoring ?? true);
          setPermissions(data.child.permissions || permissions);
          
          const age = new Date().getFullYear() - new Date(data.child.birthdate).getFullYear();
          setChildAge(age);
        } else if (approvalToken) {
          // Load from parent approval
          const response = await fetch(`/api/parent-approval/check?token=${encodeURIComponent(approvalToken)}`, { cache: 'no-store' });
          if (!response.ok) throw new Error('Failed to load approval');
          const data = await response.json();
          
          console.log('[CHILD_PERMISSION_FORM] Approval data:', data.approval);
          
          setChildFirstName(data.approval.childFirstName || '');
          setChildLastName(data.approval.childLastName || '');
          setChildBirthdate(data.approval.childBirthdate || '');
          setUsername(`${data.approval.childFirstName.toLowerCase()}${data.approval.childLastName ? data.approval.childLastName.toLowerCase() : ''}`);
          
          const age = new Date().getFullYear() - new Date(data.approval.childBirthdate).getFullYear();
          setChildAge(age);
          
          console.log('[CHILD_PERMISSION_FORM] Set child name:', data.approval.childFirstName, data.approval.childLastName);
        } else if (inviteCode) {
          // Load from invite
          const response = await fetch(`/api/invites/validate?code=${encodeURIComponent(inviteCode)}`, { cache: 'no-store' });
          if (!response.ok) throw new Error('Failed to load invite');
          const data = await response.json();
          
          setChildFirstName(data.friendFirstName || '');
          setChildLastName(data.friendLastName || '');
          setChildBirthdate(data.childBirthdate || '');
          setUsername(`${data.friendFirstName.toLowerCase()}${data.friendLastName ? data.friendLastName.toLowerCase() : ''}`);
          
          const age = new Date().getFullYear() - new Date(data.childBirthdate).getFullYear();
          setChildAge(age);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if ((mode === 'edit' && childId) || (mode === 'create' && (approvalToken || inviteCode))) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [childId, approvalToken, inviteCode, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (mode === 'create') {
      if (!redAlertAccepted) {
        setError('You must accept the Red Alert system');
        return;
      }
      if (!username.trim() || !password.trim()) {
        setError('Username and password are required');
        return;
      }
    } else if (mode === 'edit') {
      if (!currentPassword.trim()) {
        setError('Current password is required for security');
        return;
      }
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const endpoint = mode === 'edit' && childId ? `/api/parent/children/${childId}` : '/api/parent/children';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const requestData = {
        ...(mode === 'create' && {
          approvalToken: approvalToken || inviteCode,
          firstName: childFirstName,
          lastName: childLastName,
          birthdate: new Date(childBirthdate).getTime(),
        }),
        ...(mode === 'edit' && { childId }),
        username: username.trim(),
        ...(password && { password }),
        ...(currentPassword && { currentPassword }),
        childEmail: childEmail.trim() || undefined,
        redAlertAccepted: mode === 'create' ? redAlertAccepted : undefined,
        silentMonitoring,
        secondParentEmail: secondParentEmail.trim() || undefined,
        permissions,
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save child');
      }

      const result = await response.json();

      if (mode === 'create') {
        if (onSuccess) {
          onSuccess(`${childFirstName} ${childLastName}`.trim(), true);
        } else {
          router.replace(`/parents/hq/success?childName=${encodeURIComponent(`${childFirstName} ${childLastName}`)}`);
        }
      } else {
        setSuccessMessage(`✅ Permissions updated for ${childFirstName}`);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(`${childFirstName} ${childLastName}`.trim(), false);
          }
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save child');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        <p className="ml-3 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-blue-900">
            ⚡ Parent HQ - Child Permission Setup
          </CardTitle>
          <p className="text-blue-700 text-sm sm:text-base mt-2">
            {mode === 'create'
              ? 'Every child must have parents complete these permissions before account creation'
              : 'Update permissions for your child'}
          </p>
        </CardHeader>
      </Card>

      {/* Child Info */}
      <Card className="border-gray-200">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Child Information</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 space-y-3 text-sm sm:text-base">
          {!childFirstName && !childLastName ? (
            <p className="text-gray-500 italic">Loading child information...</p>
          ) : (
            <>
              <p><strong>Name:</strong> {childFirstName} {childLastName}</p>
              {childAge !== null && <p><strong>Age:</strong> {childAge} years old</p>}
              <p><strong>Username:</strong> @{username}</p>
            </>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Red Alert Agreement */}
        {mode === 'create' && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-red-900 text-base sm:text-lg">🚨 Red Alert System</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 space-y-3">
              <p className="text-red-800 text-sm sm:text-base">
                The Red Alert System immediately suspends posts and notifies AI moderation and parents of concerning behavior. This is a critical safety feature.
              </p>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="redAlert"
                  checked={redAlertAccepted}
                  onCheckedChange={(checked) => setRedAlertAccepted(checked as boolean)}
                />
                <Label htmlFor="redAlert" className="text-red-800 font-medium">
                  I understand the Red Alert system is critical for {childFirstName}'s safety
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Setup */}
        {mode === 'create' && (
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Create Child Account</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm sm:text-base font-medium">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  className="text-sm sm:text-base"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm sm:text-base font-medium">Password</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="text-sm sm:text-base"
                />
              </div>

              <div>
                <Label htmlFor="childEmail" className="text-sm sm:text-base font-medium">Child's Email (Optional)</Label>
                <Input
                  id="childEmail"
                  type="email"
                  value={childEmail}
                  onChange={(e) => setChildEmail(e.target.value)}
                  placeholder="child@example.com"
                  className="text-sm sm:text-base"
                />
                <p className="text-gray-600 text-xs sm:text-sm mt-1">
                  {childAge && childAge < 13 ? 'Magic links sent to your email' : 'Direct login with magic links'}
                </p>
              </div>

              <div>
                <Label htmlFor="secondParentEmail" className="text-sm sm:text-base font-medium">Additional Parent/Guardian Email (Optional)</Label>
                <Input
                  id="secondParentEmail"
                  type="email"
                  value={secondParentEmail}
                  onChange={(e) => setSecondParentEmail(e.target.value)}
                  placeholder="other-parent@example.com"
                  className="text-sm sm:text-base"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {mode === 'edit' && (
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Update Account</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="text-sm sm:text-base font-medium">Current Password (Required for changes)</Label>
                <PasswordInput
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="text-sm sm:text-base"
                />
              </div>

              <div>
                <Label htmlFor="newPassword" className="text-sm sm:text-base font-medium">New Password (Optional)</Label>
                <PasswordInput
                  id="newPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="text-sm sm:text-base"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monitoring & Safety */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Monitoring & Safety</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="silentMonitoring"
                checked={silentMonitoring}
                onCheckedChange={(checked) => setSilentMonitoring(checked as boolean)}
              />
              <Label htmlFor="silentMonitoring" className="text-sm sm:text-base font-medium">
                Enable Silent Monitoring (Recommended)
              </Label>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm">Monitor {childFirstName}'s activity without them knowing</p>
          </CardContent>
        </Card>

        {/* Invite Permissions */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">📬 Invite Permissions</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 space-y-4">
            {/* Receiving Invites */}
            <div className="space-y-2 pb-3 border-b">
              <h4 className="font-semibold text-sm sm:text-base">Receiving Invites</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canReceiveInvites"
                  checked={permissions.canReceiveInvites}
                  onCheckedChange={(checked) =>
                    setPermissions((prev) => ({ ...prev, canReceiveInvites: checked as boolean }))
                  }
                />
                <Label htmlFor="canReceiveInvites" className="text-sm sm:text-base">Can receive invites</Label>
              </div>
              {permissions.canReceiveInvites && (
                <div className="ml-6 flex items-center space-x-2">
                  <Checkbox
                    id="receiveInvitesRequireApproval"
                    checked={permissions.receiveInvitesRequireApproval}
                    onCheckedChange={(checked) =>
                      setPermissions((prev) => ({ ...prev, receiveInvitesRequireApproval: checked as boolean }))
                    }
                  />
                  <Label htmlFor="receiveInvitesRequireApproval" className="text-sm sm:text-base">Invites require my approval</Label>
                </div>
              )}
            </div>

            {/* Sending Invites to Children */}
            <div className="space-y-2 pb-3 border-b">
              <h4 className="font-semibold text-sm sm:text-base">Sending Invites to Children</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canSendInvitesToChildren"
                  checked={permissions.canSendInvitesToChildren}
                  onCheckedChange={(checked) =>
                    setPermissions((prev) => ({ ...prev, canSendInvitesToChildren: checked as boolean }))
                  }
                />
                <Label htmlFor="canSendInvitesToChildren" className="text-sm sm:text-base">Can invite children</Label>
              </div>
              {permissions.canSendInvitesToChildren && (
                <div className="ml-6 flex items-center space-x-2">
                  <Checkbox
                    id="sendInvitesToChildrenRequireApproval"
                    checked={permissions.sendInvitesToChildrenRequireApproval}
                    onCheckedChange={(checked) =>
                      setPermissions((prev) => ({ ...prev, sendInvitesToChildrenRequireApproval: checked as boolean }))
                    }
                  />
                  <Label htmlFor="sendInvitesToChildrenRequireApproval" className="text-sm sm:text-base">Require my approval</Label>
                </div>
              )}
            </div>

            {/* Sending Invites to Adults */}
            <div className="space-y-2 pb-3 border-b">
              <h4 className="font-semibold text-sm sm:text-base">Sending Invites to Adults</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canSendInvitesToAdults"
                  checked={permissions.canSendInvitesToAdults}
                  onCheckedChange={(checked) =>
                    setPermissions((prev) => ({ ...prev, canSendInvitesToAdults: checked as boolean }))
                  }
                />
                <Label htmlFor="canSendInvitesToAdults" className="text-sm sm:text-base">Can invite adults</Label>
              </div>
              {permissions.canSendInvitesToAdults && (
                <div className="ml-6 flex items-center space-x-2">
                  <Checkbox
                    id="sendInvitesToAdultsRequireApproval"
                    checked={permissions.sendInvitesToAdultsRequireApproval}
                    onCheckedChange={(checked) =>
                      setPermissions((prev) => ({ ...prev, sendInvitesToAdultsRequireApproval: checked as boolean }))
                    }
                  />
                  <Label htmlFor="sendInvitesToAdultsRequireApproval" className="text-sm sm:text-base">Require my approval</Label>
                </div>
              )}
            </div>

            {/* Sending Invites to Parents */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm sm:text-base">Sending Invites to Parents</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canSendInvitesToParents"
                  checked={permissions.canSendInvitesToParents}
                  onCheckedChange={(checked) =>
                    setPermissions((prev) => ({ ...prev, canSendInvitesToParents: checked as boolean }))
                  }
                />
                <Label htmlFor="canSendInvitesToParents" className="text-sm sm:text-base">Can invite parents</Label>
              </div>
              {permissions.canSendInvitesToParents && (
                <div className="ml-6 flex items-center space-x-2">
                  <Checkbox
                    id="sendInvitesToParentsRequireApproval"
                    checked={permissions.sendInvitesToParentsRequireApproval}
                    onCheckedChange={(checked) =>
                      setPermissions((prev) => ({ ...prev, sendInvitesToParentsRequireApproval: checked as boolean }))
                    }
                  />
                  <Label htmlFor="sendInvitesToParentsRequireApproval" className="text-sm sm:text-base">Require my approval</Label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Permissions */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Activity & Content Permissions</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'canCreateCliqs', label: 'Can create cliqs' },
                { id: 'canCreatePublicCliqs', label: 'Can create public cliqs' },
                { id: 'canJoinPublicCliqs', label: 'Can join public cliqs', note: 'Age appropriate only' },
                { id: 'canPost', label: 'Can create posts' },
                { id: 'canComment', label: 'Can comment on posts' },
                { id: 'canReact', label: 'Can react to posts' },
                { id: 'canViewProfiles', label: 'Can view other profiles' },
                { id: 'canUploadVideos', label: 'Can upload videos' },
              ].map(({ id, label, note }) => (
                <div key={id}>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={id}
                      checked={(permissions as any)[id]}
                      onCheckedChange={(checked) =>
                        setPermissions((prev) => ({ ...prev, [id]: checked as boolean }))
                      }
                    />
                    <Label htmlFor={id} className="text-sm sm:text-base">{label}</Label>
                  </div>
                  {note && <p className="text-xs text-gray-500 ml-6 mt-1">{note}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 text-sm sm:text-base"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || (mode === 'create' && !redAlertAccepted)}
            className="flex-1 text-sm sm:text-base"
          >
            {submitting
              ? mode === 'edit'
                ? 'Updating...'
                : 'Creating...'
              : mode === 'edit'
              ? '⚡ Update Permissions'
              : '⚡ Complete Setup'}
          </Button>
        </div>
      </form>
    </div>
  );
}
