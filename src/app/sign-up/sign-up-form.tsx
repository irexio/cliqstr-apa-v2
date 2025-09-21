'use client';

// 🔐 APA-HARDENED SIGN-UP FORM - Child-Aware Flow
// Starts with firstName + birthdate, then branches based on age:
// - Children: Parent approval flow
// - Adults: Full account creation
// Maintains APA compliance with proper child protection

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/label';
import { fetchJson } from '@/lib/fetchJson';
import PasswordInput from '@/components/ui/PasswordInput';

type FlowStep = 'initial' | 'child-parent-email' | 'adult-credentials' | 'child-success' | 'adult-processing';

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite') || null;
  const preFilledEmail = searchParams.get('email') || null;
  const approvalToken = searchParams.get('approvalToken') || null;

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Adult' | 'Child' | 'Parent' | null>(null);
  const [parentEmail, setParentEmail] = useState('');
  const [email, setEmail] = useState(preFilledEmail || '');
  const [password, setPassword] = useState('');
  
  // Flow state
  const [currentStep, setCurrentStep] = useState<FlowStep>(approvalToken ? 'adult-credentials' : 'initial');
  
  // Debug logging
  console.log('[SIGNUP_FORM] Initial state:', {
    approvalToken,
    preFilledEmail,
    currentStep,
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'server'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChild, setIsChild] = useState(false);
  const [childName, setChildName] = useState('');

  // Load child name from API if this is a parent approval flow
  useEffect(() => {
    if (approvalToken && typeof window !== 'undefined') {
      const fetchChildName = async () => {
        try {
          const res = await fetch(`/api/parent-approval/check?token=${encodeURIComponent(approvalToken)}`);
          const data = await res.json();
          if (res.ok && data?.approval) {
            setChildName(`${data.approval.childFirstName} ${data.approval.childLastName}`);
          }
        } catch (error) {
          console.error('Error fetching approval data:', error);
        }
      };
      fetchChildName();
    }
  }, [approvalToken]);

  const calculateAge = (dob: string) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Handle initial form submission (firstName + birthdate)
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!firstName || !lastName || !birthdate) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Calculate age and automatically determine role
    const age = calculateAge(birthdate);
    const isChild = age < 18;
    setIsChild(isChild);
    
    // Automatically route based on age
    if (isChild) {
      setCurrentStep('child-parent-email');
    } else {
      setCurrentStep('adult-credentials');
    }
  };

  // Handle role selection
  const handleRoleSelection = (role: 'Adult' | 'Child' | 'Parent') => {
    setSelectedRole(role);
    setError('');
    
    if (role === 'Child') {
      setIsChild(true);
      setCurrentStep('child-parent-email');
    } else {
      setIsChild(false);
      setCurrentStep('adult-credentials');
    }
  };
  
  // Handle parent email submission for children
  const handleChildParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await fetchJson('/api/parent-approval/request', {
        method: 'POST',
        body: JSON.stringify({
          childFirstName: firstName,
          childLastName: lastName,
          childBirthdate: birthdate,
          parentEmail: parentEmail,
        }),
      });
      
      setCurrentStep('child-success');
      // Redirect to awaiting-approval page after a short delay to show success message
      setTimeout(() => {
        router.push('/awaiting-approval');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send parent approval request');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle adult credentials submission
  const handleAdultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!firstName || !lastName || !birthdate) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      // Check if this is a parent approval flow
      if (approvalToken) {
        console.log('[PARENT-APPROVAL] Processing parent sign-up with approval token');

        // Fetch approval details directly from API
        const resCheck = await fetch(`/api/parent-approval/check?token=${encodeURIComponent(approvalToken)}`);
        const data = await resCheck.json();

        if (!resCheck.ok || !data?.approval) {
          setError('Invalid or expired approval token. Please try the link again.');
          setLoading(false);
          return;
        }

        const approval = data.approval;

        const body = {
          firstName,
          lastName,
          email: approval.parentEmail || email, // prefill from server
          password,
          birthdate,
          approvalToken,
        };

        const res = await fetchJson('/api/parent-approval/signup', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        if (res.success) {
          router.push(`/choose-plan?approvalToken=${encodeURIComponent(approvalToken)}`);
        } else {
          setError(res.error || 'Failed to create parent account');
          setLoading(false);
        }
        return;
      }

      // Regular adult sign-up flow
      const body: Record<string, string> = {
        firstName,
        lastName,
        email,
        password,
        birthdate,
        role: selectedRole || 'Adult', // Include selected role
      };

      if (inviteCode) {
        body.inviteCode = inviteCode;
      }
      
      console.log('Submitting sign-up form for adult user');
      
      // First store the email in localStorage before making the API call
      // This ensures we have it even if there's an error
      localStorage.setItem('pendingVerificationEmail', email);
      

      
      const res = await fetchJson('/api/sign-up', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      // Check if we need to redirect to verification pending page
      if (res.redirectUrl === '/verification-pending') {
        // Email is already stored in localStorage above
        setCurrentStep('adult-processing');
        
        // Show processing message briefly before redirecting
        setTimeout(() => {
          router.push('/verification-pending');
        }, 1500);
      } else if (res.isVerified) {
        // Pre-verified user (like parent invites) - can proceed directly
        try {
          const signInRes = await fetchJson('/api/sign-in', {
            method: 'POST',
            body: JSON.stringify({
              email,
              password
            }),
          });
          
          // Redirect to the appropriate page
          if (signInRes.redirectUrl) {
            // Add a small delay to ensure session is established
            setTimeout(() => {
              window.location.href = signInRes.redirectUrl;
            }, 100);
          } else {
            // Add a small delay to ensure session is established
            setTimeout(() => {
              window.location.href = '/my-cliqs-dashboard';
            }, 100);
          }
        } catch (signInErr: any) {
          console.error('Auto sign-in failed:', signInErr);
          // If auto sign-in fails, still consider signup successful
          // and redirect to sign-in page
          router.push('/sign-in');
        }
      } else {
        // Default to verification pending for safety
        setCurrentStep('adult-processing');
        setTimeout(() => {
          router.push('/verification-pending');
        }, 1500);
      }
    } catch (err: any) {
      console.error('❌ Sign-up error:', err);
      
      // If we have a detailed error message from the server, use it
      if (err.data && err.data.details) {
        console.error('Server error details:', err.data.details);
      }
      
      // Handle the error but still redirect to verification pending
      // This ensures the user experience isn't broken even if email sending fails
      if (err.status === 500) {
        console.log('Server error during sign-up, but continuing to verification page');
        // We already stored the email in localStorage above
        setCurrentStep('adult-processing');
        
        setTimeout(() => {
          router.push('/verification-pending');
        }, 1500);
        return;
      }
      
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Child success message
  if (currentStep === 'child-success') {
    return (
      <div className="max-w-md mx-auto p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-green-800 mb-2">Parent Approval Sent!</h2>
          <p className="text-green-700 mb-4">
            Hi {firstName}! We've emailed your parent/guardian for approval. Once they approve, you'll be able to create your account!
          </p>
          <p className="text-green-600 text-sm">
            <strong>Be sure to ask them to check their email at:</strong><br />
            <span className="font-mono bg-green-100 px-2 py-1 rounded">{parentEmail}</span>
          </p>
          <div className="mt-6">
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Log what step we're rendering
  console.log('[SIGNUP_FORM] Rendering step:', currentStep);

  // Step 1: Initial form (firstName + birthdate)
  if (currentStep === 'initial') {
    return (
      <form onSubmit={handleInitialSubmit} className="space-y-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="birthdate">Birthdate</Label>
          <Input
            id="birthdate"
            type="date"
            required
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Processing...' : 'Continue'}
        </Button>
      </form>
    );
  }
  
  
  // Step 2: Child parent email
  if (currentStep === 'child-parent-email') {
    return (
      <div className="space-y-4">
        <div className="bg-black border border-black rounded-lg p-4 mb-4 text-white">
          <h3 className="font-semibold text-white mb-2">Hi {firstName}!</h3>
          <p className="text-gray-200 text-sm">
            We're so glad you want to join Cliqstr. Because you're under 18, your parent or guardian will need to approve your account first.
          </p>
        </div>
        
        <form onSubmit={handleChildParentSubmit} className="space-y-4">
          <div>
            <Label htmlFor="parentEmail">Parent/Guardian Email</Label>
            <Input
              id="parentEmail"
              type="email"
              required
              autoComplete="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="parent@example.com"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Sending approval request...' : 'Send Approval Request'}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setCurrentStep('initial')}
            className="w-full"
          >
            Back
          </Button>
        </form>
      </div>
    );
  }
  
  // Step 4: Adult credentials
  if (currentStep === 'adult-credentials') {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-green-900 mb-2">
            {approvalToken ? `Parent Account Setup` : `Great, ${firstName}!`}
          </h3>
          <p className="text-green-800 text-sm">
            {approvalToken ? (
              <>
                Your child <strong>{childName}</strong> wants to join Cliqstr. 
                Let's create your parent account to approve their request.
              </>
            ) : (
              `Let's finish creating your account.`
            )}
          </p>
        </div>
        
        <form onSubmit={handleAdultSubmit} className="space-y-4">
          {approvalToken && (
            <>
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  required
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="birthdate">Birthdate</Label>
                <Input
                  id="birthdate"
                  type="date"
                  required
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setCurrentStep('initial')}
            className="w-full"
          >
            Back
          </Button>
        </form>
      </div>
    );
  }
  
  // Step 5: Adult processing (verification pending)
  if (currentStep === 'adult-processing') {
    return (
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 mx-auto bg-black rounded-full flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="font-semibold text-xl">Creating your account...</h3>
        <p className="text-gray-600">
          We're setting up your account and sending a verification email.
        </p>
      </div>
    );
  }
  
  // Fallback
  return null;
}
