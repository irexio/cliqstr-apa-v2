'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TicketIcon } from '@heroicons/react/24/outline';

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

type MobileMenuProps = {
  isLoggedIn: boolean;
  isApproved: boolean;
  userData: UserData | null;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  setInviteModalOpen: (isOpen: boolean) => void;
  handleSignOut: () => Promise<void>;
};

export function MobileMenu({ 
  isLoggedIn, 
  isApproved,
  userData, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen,
  setInviteModalOpen,
  handleSignOut
}: MobileMenuProps) {
  const [avatarError, setAvatarError] = useState(false);

  if (!isMobileMenuOpen) {
    return null;
  }

  // Safe user values with fallbacks
  const displayName = userData?.name || userData?.email?.split('@')?.[0] || 'User';
  const userRole = userData?.role?.toLowerCase() || 'user';
  const userId = userData?.id || '';
  const userInitials = (userData?.name || userData?.email || 'U').substring(0, 2).toUpperCase();

  return (
    <div className="md:hidden absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-lg z-50">
      <nav className="flex flex-col px-4 py-4 text-sm font-medium text-[#202020]">
        <Link
          href="/help"
          className="block hover:text-black transition py-3 border-b border-gray-100"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Get Help
        </Link>
        <Link
          href="/how-it-works"
          className="block hover:text-black transition py-3 border-b border-gray-100"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          How It Works
        </Link>
        <Link
          href="/about"
          className="block hover:text-black transition py-3 border-b border-gray-100"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          About
        </Link>
        <Link
          href="/faqs"
          className="block hover:text-black transition py-3 border-b border-gray-100"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          FAQs
        </Link>

        {isLoggedIn && (
          <Link
            href="/my-cliqs-dashboard"
            className="block font-semibold hover:text-black transition py-3 border-b border-gray-100"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            My Cliqs
          </Link>
        )}

        {/* Mobile Auth Buttons */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          {isLoggedIn && userData ? (
            <div className="space-y-2">
              {/* User Info */}
              <div className="px-4 py-3 border-b flex items-center gap-3">
                {userData.avatarUrl && !avatarError ? (
                  <Image 
                    src={userData.avatarUrl} 
                    alt={`${displayName}'s avatar`}
                    width={28} 
                    height={28} 
                    className="rounded-full"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-7 h-7 bg-gray-100 text-black rounded-full flex items-center justify-center text-xs font-medium">
                    {userInitials}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize truncate">
                    {userRole}
                  </p>
                </div>
              </div>

              {userData?.myProfile?.username ? (
                <Link 
                  href={`/profile/${userData.myProfile.username}`} 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Your Profile
                </Link>
              ) : (
                <Link 
                  href="/profile/create" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create Profile
                </Link>
              )}
              
              <Link 
                href="/account" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Account Settings
              </Link>

              {/* Show billing link only for adults and parents */}
              {(userData?.role === 'PARENT' || userData?.role === 'ADULT') && (
                <Link 
                  href="/billing" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Billing & Plans
                </Link>
              )}

              {/* Show Parents HQ only for parents */}
              {userData?.role === 'PARENT' && (
                <Link
                  href="/parents/hq/manage"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ⚡ Parents HQ
                </Link>
              )}

              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setInviteModalOpen(true);
                }}
                className="flex items-center justify-center text-sm bg-gradient-to-r from-gray-100 to-gray-200 text-black border border-gray-300 hover:border-[#c032d1] px-3 py-2 rounded-full shadow-sm w-full my-2"
              >
                <TicketIcon className="h-4 w-4 mr-1 text-[#c032d1]" />
                <span>Join with <span className="font-bold">Invite</span></span>
              </button>
              <Link
                href="/sign-in"
                className="block px-4 py-2 border border-black text-black rounded-full text-center hover:bg-gray-100 transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="block px-4 py-2 bg-black text-white rounded-full text-center hover:bg-[#c032d1] transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}

export default MobileMenu;
