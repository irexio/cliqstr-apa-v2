'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PasswordInput from '@/components/ui/PasswordInput';

interface ApprovalDetails {
  childFirstName: string;
  childLastName: string;
  childBirthdate: string;
  parentEmail: string;
  context: string;
}

interface InviteDetails {
  friendFirstName: string;
  friendLastName: string;
  childBirthdate: string;
  parentEmail: string;
  cliqName: string;
  inviterName: string;
}

interface ChildSignupApprovalFlowProps {
  approvalToken?: string;
  inviteCode?: string;
}

/**
 * 🔐 APA-HARDENED COMPONENT: Parent HQ - Child Signup Approval Flow
 * 
 * Purpose:
 *   - PARENT HQ: Complete child permission setup interface for direct signups
 *   - Fetches approval details and shows child info
 *   - Collects ALL required parent permissions and settings
 *   - Creates child account only after FULL Parent HQ approval
 * 
 * Critical: 
 *   - This IS the Parent HQ for child signup approval
 *   - Every child MUST have parents complete these permissions
 *   - Approval is NOT marked as completed until final Parent HQ approval
 */
export default function ChildSignupApprovalFlow({ approvalToken, inviteCode }: ChildSignupApprovalFlowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [approvalDetails, setApprovalDetails] = useState<ApprovalDetails | null>(null);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [redAlertAccepted, setRedAlertAccepted] = useState(false);
  const [silentMonitoring, setSilentMonitoring] = useState(true);
  const [secondParentEmail, setSecondParentEmail] = useState('');
  const [permissions, setPermissions] = useState({
    canPost: true,
    canComment: true,
    canReact: true,
    canViewProfiles: true,
    canReceiveInvites: true,
    canCreatePublicCliqs: false,
    canInviteChildren: false,
    canInviteAdults: false,
    canCreateCliqs: false,
    canUploadVideos: false,
    invitesRequireParentApproval: true, // Default to true for safety, but parent can change
  });

  // Fetch approval details or invite details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        
        if (approvalToken) {
          // Handle direct child signup approval
          const response = await fetch(
            `/api/parent-approval/check?token=${encodeURIComponent(approvalToken)}`,
            { cache: 'no-store' }
          );
          const data = await response.json();

          if (!response.ok || !data.approval) {
            throw new Error('Failed to load approval details');
          }

          setApprovalDetails({
            childFirstName: data.approval.childFirstName,
            childLastName: data.approval.childLastName,
            childBirthdate: data.approval.childBirthdate,
            parentEmail: data.approval.parentEmail,
            context: data.approval.context,
          });
        } else if (inviteCode) {
          // Handle child invite approval
          const response = await fetch(
            `/api/invites/validate?code=${encodeURIComponent(inviteCode)}`,
            { cache: 'no-store' }
          );
          const data = await response.json();

          if (!response.ok || data?.valid === false) {
            const reason = data?.reason || data?.error || 'invalid_invite';
            throw new Error(typeof reason === 'string' ? reason : 'Failed to load invite details');
          }

          setInviteDetails({
            friendFirstName: data.childInfo?.firstName || data.invite?.friendFirstName || 'Child',
            friendLastName: data.childInfo?.lastName || data.invite?.friendLastName || '',
            childBirthdate: data.childInfo?.birthdate || data.invite?.childBirthdate || '',
            parentEmail: data.invite?.parentEmail || '',
            cliqName: data.cliqName || data.invite?.cliq?.name || 'Unknown Cliq',
            inviterName: data.inviterName || data.invite?.inviterName || 'Unknown',
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [approvalToken, inviteCode]);

  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!redAlertAccepted) {
      setError('You must accept the Red Alert monitoring agreement');
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Log start
      console.log('[PARENTS_HQ][signup-approval] start', { token: approvalToken, username, perms: permissions });

      const response = await fetch('/api/parent/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // For direct signup approval
          approvalToken: approvalToken,
          // For child invite approval
          code: inviteCode,
          // Child details (from either source)
          firstName: approvalDetails?.childFirstName || inviteDetails?.friendFirstName,
          lastName: approvalDetails?.childLastName || inviteDetails?.friendLastName,
          birthdate: approvalDetails?.childBirthdate 
            ? new Date(approvalDetails.childBirthdate).getTime() 
            : inviteDetails?.childBirthdate 
            ? new Date(inviteDetails.childBirthdate).getTime() 
            : 0,
          // Account details
          username: username.trim(),
          password,
          redAlertAccepted,
          silentMonitoring,
          permissions,
          secondParentEmail: secondParentEmail.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const reason = data?.error || 'server_error';
        console.warn('[PARENTS_HQ][signup-approval] failure', { reason });
        
        // For critical errors, redirect to help page
        if (reason.includes('Invalid or expired') || reason.includes('Failed to create') || reason.includes('server_error')) {
          router.push('/parents/hq/help');
          return;
        }
        
        setError(reason);
        setSubmitting(false);
        return;
      }

      // Success - redirect to success page
      console.log('[PARENTS_HQ][signup-approval] success');
      router.replace(`/parents/hq/success?childName=${encodeURIComponent(childFirstName)}`);
      
    } catch (err: any) {
      console.error('[PARENTS_HQ][signup-approval] error', err);
      
      // For critical errors, redirect to help page
      router.push('/parents/hq/help');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        <p className="ml-3 text-gray-600">Loading approval details...</p>
      </div>
    );
  }

  if (error && !approvalDetails && !inviteDetails) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800 font-medium">Error Loading Details</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/parents/hq')} 
            className="mt-4"
          >
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Get child details from either source
  const childFirstName = approvalDetails?.childFirstName || inviteDetails?.friendFirstName || 'Child';
  const childLastName = approvalDetails?.childLastName || inviteDetails?.friendLastName || '';
  const childName = `${childFirstName} ${childLastName}`.trim();
  const childBirthdate = approvalDetails?.childBirthdate || inviteDetails?.childBirthdate;
  const childAge = childBirthdate 
    ? new Date().getFullYear() - new Date(childBirthdate).getFullYear()
    : null;

  return (
    <div className="space-y-6">
      {/* Parent HQ Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">🛡️ Parent HQ - Child Permission Setup</CardTitle>
          <p className="text-blue-700 text-sm">Every child must have parents complete these permissions before account creation</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-blue-800">
            <p><strong>Child:</strong> {childName}</p>
            {childAge && <p><strong>Age:</strong> {childAge} years old</p>}
            {approvalDetails ? (
              <>
                <p><strong>Request Type:</strong> Direct Signup</p>
                <p><strong>Context:</strong> {approvalDetails.context === 'direct_signup' ? 'Direct Signup' : approvalDetails.context === 'child_invite' ? 'Child Invite' : approvalDetails.context || 'Not specified'}</p>
              </>
            ) : inviteDetails ? (
              <>
                <p><strong>Request Type:</strong> Child Invite</p>
                <p><strong>Invited by:</strong> {inviteDetails.inviterName}</p>
                <p><strong>To join:</strong> {inviteDetails.cliqName}</p>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Red Alert Agreement */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">🚨 Red Alert System - Critical Safety Feature</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-red-800 text-sm">
              <strong>Red Alert System:</strong> When a Red Alert is pressed, the post is immediately suspended, 
              AI moderation and parents are both instantly notified. This is a critical safety feature.
            </p>
            <p className="text-red-800 text-sm">
              By approving this signup, you understand that {childFirstName}'s activity 
              will be monitored for safety and you will receive instant alerts for any concerning behavior.
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
          </div>
        </CardContent>
      </Card>

      {/* Account Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Create Child Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitApproval} className="space-y-4">
            <div>
              <Label htmlFor="username">Username for {childFirstName}</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                minLength={3}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                required
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm the password"
                required
                minLength={6}
              />
            </div>

            {/* Additional Parent/Guardian Email */}
            <div>
              <Label htmlFor="secondParentEmail">Additional Parent/Guardian Email (Optional)</Label>
              <input
                id="secondParentEmail"
                type="email"
                value={secondParentEmail}
                onChange={(e) => setSecondParentEmail(e.target.value)}
                placeholder="Enter additional parent or guardian email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add another parent or guardian who should also receive notifications about {childFirstName}.
              </p>
            </div>

            {/* Silent Monitoring Toggle */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="silentMonitoring"
                  checked={silentMonitoring}
                  onCheckedChange={(checked) => setSilentMonitoring(checked as boolean)}
                />
                <Label htmlFor="silentMonitoring" className="font-medium">
                  Enable Silent Monitoring (Recommended)
                </Label>
              </div>
              <p className="text-gray-600 text-sm mt-1">
                Monitor {childFirstName}'s activity without them knowing
              </p>
            </div>

            {/* Parent HQ: Child Permissions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">🛡️ Parent HQ: Set Permissions for {childFirstName}</h4>
              <p className="text-gray-600 text-xs mb-3">Select which features you want activated on your child's account</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canCreateCliqs"
                    checked={permissions.canCreateCliqs}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, canCreateCliqs: checked as boolean }))
                    }
                  />
                  <Label htmlFor="canCreateCliqs" className="text-sm">
                    Can create cliqs
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canInviteChildren"
                    checked={permissions.canInviteChildren}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, canInviteChildren: checked as boolean }))
                    }
                  />
                  <Label htmlFor="canInviteChildren" className="text-sm">
                    Can invite children
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canInviteAdults"
                    checked={permissions.canInviteAdults}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, canInviteAdults: checked as boolean }))
                    }
                  />
                  <Label htmlFor="canInviteAdults" className="text-sm">
                    Can invite adults
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canCreatePublicCliqs"
                    checked={permissions.canCreatePublicCliqs}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, canCreatePublicCliqs: checked as boolean }))
                    }
                  />
                  <Label htmlFor="canCreatePublicCliqs" className="text-sm">
                    Can create public cliqs
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canJoinAgeAppropriatePublicCliqs"
                    checked={permissions.canReceiveInvites}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, canReceiveInvites: checked as boolean }))
                    }
                  />
                  <Label htmlFor="canJoinAgeAppropriatePublicCliqs" className="text-sm">
                    Can join age appropriate public cliqs
                  </Label>
                </div>

                {/* Additional required permissions */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canPost"
                    checked={permissions.canPost}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, canPost: checked as boolean }))
                    }
                  />
                  <Label htmlFor="canPost" className="text-sm">
                    Can create posts
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canComment"
                    checked={permissions.canComment}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, canComment: checked as boolean }))
                    }
                  />
                  <Label htmlFor="canComment" className="text-sm">
                    Can comment on posts
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canReact"
                    checked={permissions.canReact}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, canReact: checked as boolean }))
                    }
                  />
                  <Label htmlFor="canReact" className="text-sm">
                    Can react to posts
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canViewProfiles"
                    checked={permissions.canViewProfiles}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, canViewProfiles: checked as boolean }))
                    }
                  />
                  <Label htmlFor="canViewProfiles" className="text-sm">
                    Can view other profiles
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canReceiveInvites"
                    checked={permissions.canReceiveInvites}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, canReceiveInvites: checked as boolean }))
                    }
                  />
                  <Label htmlFor="canReceiveInvites" className="text-sm">
                    Can receive invites
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="canUploadVideos"
                    checked={permissions.canUploadVideos}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, canUploadVideos: checked as boolean }))
                    }
                  />
                  <Label htmlFor="canUploadVideos" className="text-sm">
                    Can upload videos
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="invitesRequireParentApproval"
                    checked={permissions.invitesRequireParentApproval}
                    onCheckedChange={(checked) => 
                      setPermissions(prev => ({ ...prev, invitesRequireParentApproval: checked as boolean }))
                    }
                  />
                  <Label htmlFor="invitesRequireParentApproval" className="text-sm">
                    All invites must be parent approved (Recommended for safety)
                  </Label>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/parents/hq')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || !redAlertAccepted}
                className="flex-1"
              >
                {submitting ? 'Creating Account...' : `🛡️ Parent HQ: Complete Setup for ${childFirstName}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
