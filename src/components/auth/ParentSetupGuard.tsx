'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';

/**
 * ParentSetupGuard - Ensures parents with incomplete setup are redirected to smart router
 * 
 * This component checks if a parent has incomplete setup and redirects them to the
 * smart router to resume from the correct step.
 */
export default function ParentSetupGuard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Only check if user is loaded and is a parent
    if (isLoading || !user) return;

    // Check if parent has incomplete setup
    if (user.account?.role === 'Parent' && user.account?.setupStage !== 'completed') {
      console.log('[PARENT-SETUP-GUARD] Parent with incomplete setup detected:', {
        userId: user.id,
        setupStage: user.account.setupStage,
        role: user.account.role
      });
      
      // Redirect to smart router to resume setup
      router.push('/parent-approval/smart');
    }
  }, [user, isLoading, router]);

  return null; // This component doesn't render anything
}
