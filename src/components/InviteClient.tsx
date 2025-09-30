'use client';

/**
 * 🔐 APA-HARDENED COMPONENT: InviteClient
 *
 * Used in: /cliqs/[id]/invite/page.tsx
 *
 * Purpose:
 *   - Renders the redesigned invite form with new field structure
 *   - Supports two invite types: 'child' and 'adult'
 *   - For child invites: collects friend's name and trusted adult contact
 *   - For adult invites: collects adult's email directly
 *   - Submits invite data to /api/invite/create with new branded codes
 *
 * New Form Fields:
 *   - friendFirstName: string (required for child invites)
 *   - trustedAdultContact: string (required email for child invites)
 *   - inviteType: 'child' | 'adult' (required radio selection)
 *   - inviteNote?: string (optional message)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import toast from '@/components/ui/use-toast';

interface InviteClientProps {
  cliqId: string;
}

export default function InviteClient({ cliqId }: InviteClientProps) {
  const router = useRouter();
  
  // New simplified state for redesigned invite form
  const [friendFirstName, setFriendFirstName] = useState('');
  const [friendLastName, setFriendLastName] = useState('');
  const [childBirthdate, setChildBirthdate] = useState(''); // Child's birthdate for account creation
  const [parentEmail, setParentEmail] = useState(''); // Parent's email for approval
  const [trustedAdultContact, setTrustedAdultContact] = useState(''); // For adult invites
  const [inviteType, setInviteType] = useState<'child' | 'adult' | 'parent' | ''>(''); // Must be explicitly selected
  const [inviteNote, setInviteNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      console.log('[INVITE_FORM] Form submission started', {
        inviteType,
        friendFirstName,
        friendLastName,
        childBirthdate,
        parentEmail,
        trustedAdultContact,
        cliqId
      });
      // 🔐 Session Check: Verify user is still authenticated before API call
      const authCheck = await fetch('/api/auth/status');
      const { user } = await authCheck.json();
      
      if (!user) {
        toast({
          title: 'Session Expired',
          description: 'Please sign in again to continue.'
        });
        router.push(`/sign-in?returnTo=/cliqs/${cliqId}/invite`);
        return;
      }
      
      // Validate required fields
      console.log('[INVITE_FORM] Validating fields...');
      if (!inviteType) {
        console.log('[INVITE_FORM] Error: No invite type selected');
        throw new Error('Please select who this invite is for');
      }

      if (inviteType === 'child') {
        console.log('[INVITE_FORM] Validating child invite fields...');
        if (!friendFirstName.trim()) {
          console.log('[INVITE_FORM] Error: Missing child first name');
          throw new Error("Child's first name is required");
        }
        if (!friendLastName.trim()) {
          console.log('[INVITE_FORM] Error: Missing child last name');
          throw new Error("Child's last name is required");
        }
        if (!childBirthdate.trim()) {
          console.log('[INVITE_FORM] Error: Missing child birthdate');
          throw new Error("Child's birthdate is required");
        }
        if (!parentEmail.trim()) {
          console.log('[INVITE_FORM] Error: Missing parent email');
          throw new Error('Parent/guardian email is required');
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(parentEmail)) {
          throw new Error('Please enter a valid parent email address');
        }
        // Basic birthdate validation - just check it's not empty and looks like a date
        if (childBirthdate.length < 8) {
          throw new Error('Please enter a valid birthdate');
        }
      } else if (inviteType === 'adult') {
        if (!trustedAdultContact.trim()) {
          throw new Error('Adult email is required');
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trustedAdultContact)) {
          throw new Error('Please enter a valid email address');
        }
      } else if (inviteType === 'parent') {
        if (!trustedAdultContact.trim()) {
          throw new Error('Parent email is required');
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trustedAdultContact)) {
          throw new Error('Please enter a valid email address');
        }
      }

      // Prepare the request payload based on invite type
      console.log('[INVITE_FORM] Creating payload...');
      let payload: any = {
        cliqId,
        inviteType,
        inviteNote: inviteNote.trim() || undefined,
      };

      if (inviteType === 'child') {
        // Child invites: use parentEmail and child details
        payload.parentEmail = parentEmail.trim();
        payload.friendFirstName = friendFirstName.trim();
        payload.friendLastName = friendLastName.trim();
        payload.childBirthdate = childBirthdate.trim();
      } else {
        // Adult invites: use inviteeEmail (from trustedAdultContact field)
        payload.inviteeEmail = trustedAdultContact.trim();
      }
      
      console.log('[INVITE_FORM] Sending invite via invite API:', payload);
      const response = await fetch('/api/invites/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle session expiration gracefully
        if (response.status === 401) {
          toast({
            title: 'Session Expired',
            description: 'Your session expired. Please sign in again to continue.'
          });
          router.push(`/sign-in?returnTo=/cliqs/${cliqId}/invite`);
          return;
        }
        throw new Error(data.error || 'Failed to send invite');
      }

      setSuccess(true);
      
      if (inviteType === 'child') {
        // Child invites redirect to awaiting approval
        setTimeout(() => {
          window.location.href = '/awaiting-approval';
        }, 1500);
      } else {
        // Adult invites redirect to invite sent page
        // Reset form
        setFriendFirstName('');
        setFriendLastName('');
        setChildBirthdate('');
        setParentEmail('');
        setTrustedAdultContact('');
        setInviteType('');
        setInviteNote('');
        
        // Redirect to invitation sent page with details
        const recipientName = trustedAdultContact.trim();
        const params = new URLSearchParams({
          name: recipientName,
          type: inviteType
        });
        
        // Use router to navigate after a brief delay to show success message
        setTimeout(() => {
          window.location.href = `/invite/sent?${params.toString()}`;
        }, 1500);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Required Radio Input */}
      <div>
        <Label className="text-base font-medium">Who is this invite for? *</Label>
        <div className="flex gap-6 mt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="inviteType"
              value="adult"
              checked={inviteType === 'adult'}
              onChange={() => {
                setInviteType('adult');
                if (!inviteNote || inviteNote === 'Parent or Guardian approval is required. Please click the link to proceed.') {
                  setInviteNote('Join my Cliq on Cliqstr!');
                }
              }}
              className="w-4 h-4"
            />
            <span className="text-sm">Adult (18+)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="inviteType"
              value="child"
              checked={inviteType === 'child'}
              onChange={() => {
                setInviteType('child');
                if (!inviteNote || inviteNote === 'Join my Cliq on Cliqstr!') {
                  setInviteNote('Parent or Guardian approval is required. Please click the link to proceed.');
                }
              }}
              className="w-4 h-4"
            />
            <span className="text-sm">Child (Under 18)</span>
          </label>
        </div>
      </div>

      {/* Child Invite Notice */}
      {inviteType === 'child' && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            💡 <strong>Note:</strong> The invite will be sent to the parent/guardian's email. 
            They will create the child's account and set up permissions through Parent HQ.
          </p>
        </div>
      )}

      {/* Dynamic Form Fields Based on Invite Type */}
      {inviteType === 'child' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="friendFirstName">Child's First Name *</Label>
              <Input
                id="friendFirstName"
                type="text"
                value={friendFirstName}
                onChange={(e) => setFriendFirstName(e.target.value)}
                placeholder="First name"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="friendLastName">Child's Last Name *</Label>
              <Input
                id="friendLastName"
                type="text"
                value={friendLastName}
                onChange={(e) => setFriendLastName(e.target.value)}
                placeholder="Last name"
                required
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="childBirthdate">Child's Birthdate *</Label>
            <Input
              id="childBirthdate"
              type="date"
              value={childBirthdate}
              onChange={(e) => setChildBirthdate(e.target.value)}
              required
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Required for account creation and age verification
            </p>
          </div>
          
          <div>
            <Label htmlFor="parentEmail">Parent/Guardian Email *</Label>
            <Input
              id="parentEmail"
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="parent@example.com"
              required
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              The invite will be sent to this email address
            </p>
          </div>
        </>
      )}

      {/* Email Field - Only for Adult Invites */}
      {inviteType === 'adult' && (
        <div>
          <Label htmlFor="adultEmail">Adult Email *</Label>
          <Input
            id="adultEmail"
            type="email"
            value={trustedAdultContact}
            onChange={(e) => setTrustedAdultContact(e.target.value)}
            placeholder="email@example.com"
            required
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Adults will need to verify their age during account creation
          </p>
        </div>
      )}

      {/* Optional Message */}
      <div>
        <Label htmlFor="inviteNote">Optional Message</Label>
        <Textarea
          id="inviteNote"
          value={inviteNote}
          onChange={(e) => setInviteNote(e.target.value)}
          placeholder={inviteType === 'child' 
            ? "Add a note to the parent/guardian" 
            : "Add a personal message"}
          className="mt-1 h-20"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-green-600 text-sm">
            {inviteType === 'child'
              ? 'Invite sent to parent/guardian! They will create the child account.'
              : 'Invite sent successfully!'}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={loading || !inviteType}
        className="w-full"
      >
        {loading ? 'Sending...' : 'Send Invite'}
      </Button>
    </form>
  );
}
