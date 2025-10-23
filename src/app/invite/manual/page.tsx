'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const dynamic = 'force-dynamic';

function ManualInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill code from URL if provided
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setInviteCode(codeFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Clean up the input - remove spaces, convert to lowercase
      let cleanCode = inviteCode.trim().toLowerCase();
      
      // Strip 'cliq-' prefix if user included it
      if (cleanCode.startsWith('cliq-')) {
        cleanCode = cleanCode.substring(5);
      }

      if (!cleanCode) {
        throw new Error('Please enter a cliq code');
      }

      console.log('[MANUAL_INVITE] Validating code:', cleanCode);

      // Validate the invite code
      const response = await fetch(`/api/validate-invite?code=${cleanCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error('That code didn\'t work. Please check it and try again, or request a new invite.');
      }

      const data = await response.json();

      if (!data.valid) {
        throw new Error('That code didn\'t work. Please check it and try again, or request a new invite.');
      }

      console.log('[MANUAL_INVITE] Valid invite found:', data);

      // Store invite data in session for the flow
      const inviteContext = {
        inviteCode: cleanCode,
        inviteRole: data.inviteType || 'adult',
        cliqName: data.cliqName,
        inviterName: data.inviterName,
        friendFirstName: data.friendFirstName
      };

      // Store invite context for later use
      sessionStorage.setItem('manualInviteContext', JSON.stringify({
        inviteCode: cleanCode,
        cliqName: data.cliqName,
        inviterName: data.inviterName,
        method: 'manual' // Mark this as manual entry
      }));
      sessionStorage.setItem('inviteRole', data.inviteType || 'adult');
      localStorage.setItem('inviteRole', data.inviteType || 'adult');

      // Route based on invite role per Sol's instructions
      const inviteType = data.inviteType || 'adult';
      
      if (inviteType === 'adult') {
        console.log('[MANUAL_INVITE] Routing adult to choose-plan');
        router.push('/choose-plan');
      } else if (inviteType === 'parent') {
        console.log('[MANUAL_INVITE] Routing parent to invite/parent');
        router.push(`/invite/parent?code=${cleanCode}`);
      } else if (inviteType === 'child') {
        console.log('[MANUAL_INVITE] Routing child to parent-approval');
        
        // For child invites, we need to look up the approvalToken from the invite code
        try {
          const inviteResponse = await fetch(`/api/invites/validate?code=${cleanCode}`, {
            method: 'GET',
            cache: 'no-cache'
          });
          
          if (inviteResponse.ok) {
            const inviteData = await inviteResponse.json();
            
            // Fetch the parent approval data to get the token and parentState
            if (inviteData.approvalToken) {
              const approvalResponse = await fetch(
                `/api/parent-approval/check?token=${encodeURIComponent(inviteData.approvalToken)}`,
                { cache: 'no-store' }
              );
              
              if (approvalResponse.ok) {
                const approvalData = await approvalResponse.json();
                const parentState = approvalData.approval?.parentState || 'new_parent';
                
                console.log('[MANUAL_INVITE] Found approval token, routing with parentState:', parentState);
                router.push(
                  `/parent-approval?token=${encodeURIComponent(inviteData.approvalToken)}&parentState=${parentState}`
                );
              } else {
                console.error('[MANUAL_INVITE] Failed to fetch approval data');
                throw new Error('Unable to process this invite');
              }
            } else {
              console.error('[MANUAL_INVITE] No approval token found in invite data');
              throw new Error('Invalid invite code');
            }
          } else {
            throw new Error('Invite code not found');
          }
        } catch (err) {
          console.error('[MANUAL_INVITE] Error looking up child invite:', err);
          throw new Error('Unable to process this invite. Please check your code and try again.');
        }
      } else {
        // Fallback to adult flow
        console.log('[MANUAL_INVITE] Unknown invite type, defaulting to choose-plan');
        router.push('/choose-plan');
      }

    } catch (error: any) {
      console.error('[MANUAL_INVITE] Error:', error);
      setError(error.message || 'That code didn\'t work. Please check it and try again, or request a new invite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Enter Your Cliq Code</CardTitle>
          <CardDescription>
            Have a cliq code? Enter it below to join the conversation.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 How it works</h3>
                <p className="text-blue-800 text-sm mb-2">
                  Enter your cliq code to join a community. You can type it with or without the "cliq-" prefix.
                </p>
                <p className="text-blue-700 text-xs">
                  Example: <code className="bg-blue-100 px-1 rounded">x3np2</code> or <code className="bg-blue-100 px-1 rounded">cliq-x3np2</code>
                </p>
              </div>
              
              <div>
                <Label htmlFor="inviteCode">Cliq Code</Label>
                <Input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter your cliq code (e.g., x3np2)"
                  className="mt-1"
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !inviteCode.trim()}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Validating Code...
                </>
              ) : (
                'Join Cliq'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ManualInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    }>
      <ManualInviteContent />
    </Suspense>
  );
}
