'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

import DesktopNav from './DesktopNav';
import MobileMenu from './MobileMenu';
import InviteCodeModal from '../InviteCodeModal';

type UserData = {
  id: string;
  name?: string;
  email: string;
  role: string;
  avatarUrl?: string;
  account?: {
    stripeStatus?: string;
    plan?: string;
  };
  myProfile?: {
    username: string;
  };
};

export function HeaderComponent() {
  console.log('[Header] Component rendering at', new Date().toISOString());
  // Cache bust: 1738004100 - Force clean rebuild without hooks
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isApproved, setIsApproved] = useState(false); // Track APA approval status
  const [hasCliqs, setHasCliqs] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isMobile, setIsMobile] = useState(true); // Default to mobile for SSR
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
      '/invite/manual',
      '/not-authorized',
      '/suspended',
      '/under-development',
      '/waitlist',
      '/parent-approval'
    ];
    
    // Check exact matches and invite pages (but exclude /invite/sent which requires auth)
    return publicPaths.includes(path) || 
           (path.startsWith('/invite/') && path !== '/invite/sent') ||
           path.startsWith('/auth/') ||
           path.startsWith('/verify-');
  };

  // Check if we should skip auth checks
  const shouldSkipAuthCheck = () => {
    console.log('[Header] Checking skip conditions:', {
      pathname,
      approvalToken: searchParams.get('approvalToken'),
      isPublic: isPublicPage(pathname)
    });
    
    // Skip on public pages
    if (isPublicPage(pathname)) {
      console.log('[Header] Skipping auth check - public page:', pathname);
      return true;
    }
    
    // Skip when approvalToken is present (parent approval flow)
    if (searchParams.get('approvalToken')) {
      console.log('[Header] Skipping auth check - approvalToken present');
      return true;
    }
    
    // Special case: Skip auth checks on signup page to prevent dashboard flash
    if (pathname === '/sign-up') {
      console.log('[Header] Skipping auth check - signup page (prevents dashboard flash)');
      return true;
    }
    
    console.log('[Header] NOT skipping auth check');
    return false;
  };

  // Custom mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      console.log('[Header] Window width:', window.innerWidth, 'isMobile:', window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Session timeout in milliseconds (1 hour - balanced for safety and usability)
  const SESSION_TIMEOUT = 60 * 60 * 1000;

  // Function to handle sign out
  const handleSignOut = async () => {
    try {
      console.log('[Header] Attempting to sign out');
      const res = await fetch('/api/sign-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (res.ok) {
        console.log('[Header] Sign out successful');
      } else {
        console.warn('[Header] Sign out response not OK:', res.status);
      }
      
      // Always clean up state regardless of response
      setIsLoggedIn(false);
      setIsApproved(false); // Reset APA approval status
      setUserData(null);
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('[Header] Sign out failed:', error);
      // Even if API call fails, clear client state for safety
      setIsLoggedIn(false);
      setIsApproved(false); // Reset APA approval status
      setUserData(null);
      window.location.href = '/';
    }
  };
  
  // Function to handle auto logout
  const handleAutoLogout = async () => {
    console.log('[Header] Auto logout triggered due to inactivity');
    await handleSignOut();
  };

  // Update last activity on user interactions
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const updateActivity = () => {
      setLastActivity(Date.now());
    };
    
    // Listen for user activity
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('touchmove', updateActivity);
    window.addEventListener('scroll', updateActivity);
    
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('touchmove', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [isLoggedIn]);
  
  // Check for session timeout
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity > SESSION_TIMEOUT) {
        console.log('[Header] Session timeout detected');
        handleAutoLogout();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes instead of every minute
    
    return () => clearInterval(interval);
  }, [isLoggedIn]); // Remove lastActivity dependency to prevent frequent re-renders

  // Fetch user data and authentication status - simplified to just check if logged in
  const fetchUser = async () => {
    // Skip auth checks on public pages or when approvalToken is present
    if (shouldSkipAuthCheck()) {
      console.log('[Header] Skipping fetchUser due to skip conditions');
      return;
    }

    try {
      console.log('[Header] Attempting to fetch auth status');
      
      // Try the primary endpoint first
      try {
        const res = await fetch('/api/auth/status', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          credentials: 'include',
        });
        
        if (res.ok) {
          const data = await res.json();
          
          // Check if we have user data (it's wrapped in a 'user' object)
          const userData = data?.user || data;
          
          // If we have a user ID, they're logged in
          if (userData?.id) {
            console.log('[Header] User authenticated:', userData.id);
            setIsLoggedIn(true);
            setIsApproved(userData.account?.isApproved === true || userData.approved === true);
            
            // Set minimal user data needed for the dropdown
            // Header avatar uses Account data (firstName/lastName) for initials, not MyProfile
            const accountName = userData.account?.firstName && userData.account?.lastName 
              ? `${userData.account.firstName} ${userData.account.lastName}`
              : userData.email?.split('@')[0] || 'User';
            
            setUserData({
              id: userData.id,
              name: accountName,
              email: userData.email || '',
              role: userData.account?.role || userData.role || '',
              // Do not pass MyProfile avatar - header shows Account initials only
              account: userData.account,
              myProfile: userData.myProfile ? {
                username: userData.myProfile.username || userData.email?.split('@')[0] || 'user',
              } : undefined,
            });
            return;
          }
        }
      } catch (primaryErr) {
        console.warn('[Header] Primary auth endpoint failed:', primaryErr);
      }
      
      // If primary endpoint failed, try the fallback endpoint
      try {
        console.log('[Header] Trying fallback auth endpoint');
        const res = await fetch('/api/auth/status', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          credentials: 'include',
        });
        
        if (res.ok) {
          const data = await res.json();
          
          // Check if we have user data (it's wrapped in a 'user' object)
          const userData = data?.user || data;
          
          // If we have a user ID, they're logged in
          if (userData?.id) {
            console.log('[Header] User authenticated via fallback:', userData.id);
            setIsLoggedIn(true);
            setIsApproved(userData.account?.isApproved === true || userData.approved === true);
            
            // Set minimal user data needed for the dropdown
            // Header avatar uses Account data (firstName/lastName) for initials, not MyProfile
            const accountName = userData.account?.firstName && userData.account?.lastName 
              ? `${userData.account.firstName} ${userData.account.lastName}`
              : userData.email?.split('@')[0] || 'User';
            
            setUserData({
              id: userData.id,
              name: accountName,
              email: userData.email || '',
              role: userData.account?.role || userData.role || '',
              // Do not pass MyProfile avatar - header shows Account initials only
              account: userData.account,
              myProfile: userData.myProfile ? {
                username: userData.myProfile.username || userData.email?.split('@')[0] || 'user',
              } : undefined,
            });
            return;
          }
        }
      } catch (fallbackErr) {
        console.error('[Header] Fallback auth endpoint also failed:', fallbackErr);
      }
      
      // If we get here, user is not logged in
      console.log('[Header] No valid auth response, setting as logged out');
      setIsLoggedIn(false);
      setUserData(null);
      
    } catch (err) {
      console.error('[Header] Error in auth flow:', err);
      setIsLoggedIn(false);
      setUserData(null);
    }
  };

  useEffect(() => {
    // Only fetch user if we're not on a public page and no approvalToken
    if (!shouldSkipAuthCheck()) {
      fetchUser();
      
      // Set up interval to periodically check auth status (every 10 minutes for age gating compliance)
      const interval = setInterval(() => {
        // Re-check skip conditions on each interval
        if (!shouldSkipAuthCheck()) {
          fetchUser();
        }
      }, 10 * 60 * 1000);
      
      return () => clearInterval(interval);
    } else {
      // If we're on a public page (like signup), ensure we show unauthenticated state
      // This prevents any lingering authenticated state from causing redirects
      if (pathname === '/sign-up') {
        console.log('[Header] On signup page - ensuring unauthenticated state');
        setIsLoggedIn(false);
        setIsApproved(false);
        setUserData(null);
      }
    }
  }, [pathname, searchParams]); // Re-run when pathname or searchParams change

  return (
    <header className="w-full bg-white border-b border-gray-200 relative">
      <div className="max-w-7xl mx-auto px-4 py-6 font-poppins min-h-[88px]">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center" aria-label="Cliqstr Home">
            <span className="p-1">
              <img src="/MASTERLOGO-BLACK.png" alt="Cliqstr" className="block h-7 sm:h-8 md:h-9 lg:h-9 w-auto object-contain" />
            </span>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && <DesktopNav isLoggedIn={isLoggedIn} isApproved={isApproved} />}

          {/* Desktop Auth Buttons */}
          {!isMobile && (
            <div className="flex items-center gap-4 text-sm">
            {isLoggedIn ? (
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }} 
                  className="relative"
                  aria-label="Account menu"
                  type="button"
                >
                  <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
                    {(userData?.name || userData?.email || 'U').substring(0, 2).toUpperCase()}
                  </div>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium">{userData?.name || userData?.email?.split('@')[0] || 'User'}</p>
                      <p className="text-sm text-gray-500 capitalize">Role: {userData?.role}</p>
                      {userData?.account?.plan && (
                        <p className="text-xs text-gray-500 mt-1">
                          Plan: <span className="font-medium capitalize">{userData.account.plan}</span>
                        </p>
                      )}
                    </div>
                    
                    {userData?.myProfile?.username ? (
                      <Link 
                        href={`/profile/${userData.myProfile.username}`} 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Your Profile
                      </Link>
                    ) : (
                      <Link 
                        href="/profile/create" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Create Profile
                      </Link>
                    )}
                    
                    {/* Parents HQ Link - Only show for Parents */}
                    {userData?.role === 'Parent' && (
                      <Link 
                        href="/parents/hq" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        ⚡ Parents HQ
                      </Link>
                    )}
                    
                    <Link 
                      href="/account" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Account Settings
                    </Link>
                    
                    <div className="border-t border-gray-100 mt-1">
                      <button 
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsUserMenuOpen(false);
                          handleSignOut();
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="flex items-center bg-gradient-to-r from-gray-100 to-gray-200 text-black border border-gray-300 hover:border-[#c032d1] px-4 py-2 rounded-full shadow-sm transition-all hover:shadow"
                >
                  <span>Join with <span className="font-bold">Invite</span></span>
                </button>
                <Link
                  href="/sign-in"
                  className="px-4 py-2 border border-black text-black rounded-full hover:bg-gray-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 bg-black text-white rounded-full hover:bg-[#c032d1] transition"
                >
                  Sign Up
                </Link>
              </>
            )}
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#202020] hover:text-black transition"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
            </button>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        <MobileMenu 
          isLoggedIn={isLoggedIn}
          isApproved={isApproved}
          userData={userData}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          setInviteModalOpen={setInviteModalOpen}
          handleSignOut={handleSignOut}
        />
      </div>
      
      {/* Invite Code Modal */}
      <InviteCodeModal open={inviteModalOpen} setOpen={setInviteModalOpen} />
    </header>
  );
}

export default HeaderComponent;
