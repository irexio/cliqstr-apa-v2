"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface User {
  id: Id<"users">;
  email: string;
  plan: string | null;
  role: string | null;
  approved: boolean | null;
  myProfile: {
    id: Id<"myProfiles">;
    username: string;
    image: string | undefined;
    bannerImage: string | undefined;
    about: string | undefined;
    birthdate: number | undefined; // Can be undefined since it comes from account
    firstName: string | undefined; // Can be undefined since it comes from account
    lastName: string | undefined; // Can be undefined since it comes from account
    showYear: boolean;
  } | null;
  account: {
    role: string;
    isApproved: boolean;
    stripeStatus: string | null;
    plan: string | null;
    stripeCustomerId: string | null;
    setupStage: string | undefined;
    suspended: boolean;
    birthdate: number;
    firstName: string | undefined;
    lastName: string | undefined;
  } | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Define public pages that don't need auth checks
  const isPublicPage = (path: string) => {
    const publicPaths = [
      '/',
      '/sign-in',
      '/sign-up',
      '/about',
      '/pricing',
      '/privacy',
      '/terms',
      '/safety',
      '/how-it-works',
      '/features',
      '/for-parents',
      '/faqs',
      '/verification-pending',
      '/verification-success',
      '/awaiting-approval',
      '/reset-password',
      '/forgot-password',
      '/email-confirmation',
      '/verification-error',
      '/join',
      '/join-expired',
      '/join-invalid',
      '/invite/declined',
      '/invite/invalid',
      '/invite/sent',
      '/invite/manual',
      '/not-authorized',
      '/suspended',
      '/under-development',
      '/waitlist',
      '/parent-approval'
    ];
    
    // Check exact matches and invite pages
    return publicPaths.includes(path) || 
           path.startsWith('/invite/') ||
           path.startsWith('/auth/') ||
           path.startsWith('/verify-');
  };

  // Check if we should skip auth checks
  const shouldSkipAuthCheck = () => {
    console.log('[AuthProvider] Checking skip conditions:', {
      pathname,
      approvalToken: searchParams.get('approvalToken'),
      isPublic: isPublicPage(pathname)
    });
    
    // Skip on public pages
    if (isPublicPage(pathname)) {
      console.log('[AuthProvider] Skipping auth check - public page:', pathname);
      return true;
    }
    
    // Skip when approvalToken is present (parent approval flow)
    if (searchParams.get('approvalToken')) {
      console.log('[AuthProvider] Skipping auth check - approvalToken present');
      return true;
    }
    
    console.log('[AuthProvider] NOT skipping auth check');
    return false;
  };

  // Get session from server-side with retry logic
  useEffect(() => {
    async function getSession(retryCount = 0) {
      // Skip auth checks on public pages or when approvalToken is present
      if (shouldSkipAuthCheck()) {
        console.log('[AuthProvider] Skipping session check due to skip conditions');
        setIsLoading(false);
        return;
      }

      try {
        console.log(`[useAuth] Session check attempt ${retryCount + 1}`);
        const response = await fetch('/api/auth/status', {
          cache: 'no-store',
          credentials: 'include'
        });
        
        console.log(`[useAuth] Response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[useAuth] Session response:', { 
            user: data.user ? 'found' : 'null', 
            userId: data.user?.id,
            userEmail: data.user?.email,
            retryCount,
            hasAccount: !!data.user?.account,
            hasProfile: !!data.user?.myProfile
          });
          if (data.user?.id) {
            setSessionUserId(data.user.id);
            setIsLoading(false);
            return;
          }
        } else {
          console.log('[useAuth] Session check failed:', response.status, response.statusText);
        }
        
        // If no user found and we haven't retried too many times, retry after a short delay
        if (retryCount < 8) { // Increased retry count
          const delay = retryCount < 3 ? 300 : (retryCount < 6 ? 500 : 1000); // Shorter initial delays
          console.log(`[useAuth] Retrying session check in ${delay}ms... (attempt ${retryCount + 1}/8)`);
          setTimeout(() => getSession(retryCount + 1), delay);
          return;
        }
      } catch (error) {
        console.error('[useAuth] Failed to get session:', error);
      }
      
      console.log('[useAuth] Session check exhausted, setting loading to false');
      setIsLoading(false);
    }

    // Add initial delay for first attempt to allow session to establish
    setTimeout(() => getSession(), 100);
  }, [pathname, searchParams]); // Re-run when pathname or searchParams change

  // Get user data from Convex
  const user = useQuery(
    api.users.getCurrentUser,
    sessionUserId ? { userId: sessionUserId as Id<"users"> } : "skip"
  );

  // Debug logging
  console.log('[useAuth] Convex query state:', {
    sessionUserId,
    user: user ? 'found' : 'null',
    userEmail: user?.email,
    isLoading,
    queryLoading: user === undefined
  });

  // Don't show loading state on public pages
  const shouldShowLoading = !isPublicPage(pathname) && (isLoading || (!!sessionUserId && user === undefined));

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: shouldShowLoading,
        error: null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
