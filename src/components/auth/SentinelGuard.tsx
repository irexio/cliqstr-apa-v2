'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';

interface SentinelGuardProps {
  children: React.ReactNode;
}

/**
 * SentinelGuard - Protects Sentinel routes from non-superadmin access
 * Uses Iron-Session (via useAuth hook) and checks against SUPERADMIN_EMAIL env var
 */
export function SentinelGuard({ children }: SentinelGuardProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);

  useEffect(() => {
    // Skip until auth check is complete
    if (isLoading) return;

    // Check if user exists
    if (!user?.email) {
      console.log('[SentinelGuard] No user found, redirecting to sign-in');
      router.push('/sign-in');
      return;
    }

    // Check if user is superadmin (email match)
    const superadminEmail = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;
    const isSuperadmin = superadminEmail && user.email === superadminEmail;

    if (!isSuperadmin) {
      console.log('[SentinelGuard] User is not superadmin:', {
        userEmail: user.email,
        superadminEmail,
      });
      router.push('/not-authorized');
      return;
    }

    console.log('[SentinelGuard] ✅ User authorized as superadmin');
    setIsAuthorized(true);
    setCheckComplete(true);
  }, [user, isLoading, router]);

  // Loading state
  if (isLoading || !checkComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!isAuthorized) {
    return null; // Will redirect via useEffect
  }

  // Authorized
  return <>{children}</>;
}
