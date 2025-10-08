'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type AccountHeaderProps = {
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
    role: 'CHILD' | 'TEEN' | 'ADULT' | 'ADMIN' | 'PARENT';
    account?: {
      stripeStatus?: string;
      plan?: string;
      stripeCustomerId?: string;
    } | null;
  } | null;
};

export default function AccountHeader({ user }: AccountHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Get the first two letters of the user's name for the avatar
  const userInitials = user?.name ? user.name.substring(0, 2).toUpperCase() : '';

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <span className="font-bold text-xl text-black">Cliqstr</span>
          </Link>
        </div>
        
        <nav className="flex items-center gap-4">
          {/* Only show account icon when user is logged in */}
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="relative"
                aria-label="Account menu"
              >
                {user.avatarUrl ? (
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-gray-200">
                    <Image
                      src={user.avatarUrl}
                      alt={user.name || "User"}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
                    {userInitials}
                  </div>
                )}
              </button>
              
              {/* Dropdown menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium">{user.name || 'New User'}</p>
                    <p className="text-sm text-gray-500 capitalize">Role: {user.role}</p>
                    {user.account?.stripeStatus && (
                      <p className="text-xs text-gray-500 mt-1">
                        Plan: <span className="font-medium capitalize">{user.account.plan || user.account.stripeStatus}</span>
                      </p>
                    )}
                  </div>
                  
                  <Link 
                    href="/profile/create"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create Social Profile
                  </Link>
                  
                  <Link 
                    href="/account" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Account Settings
                  </Link>
                  
                  {/* Show billing link only for adults and parents */}
                  {(user.role === 'ADULT' || user.role === 'PARENT') && (
                    <>
                      <Link 
                        href="/billing" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Billing & Plans
                      </Link>
                      {user.account?.stripeStatus && (
                        <Link 
                          href="/account" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Subscription Details
                        </Link>
                      )}
                    </>
                  )}
                  
                  {/* Show Parents HQ only for parents */}
                  {user.role === 'PARENT' && (
                    <Link 
                      href="/parents/hq" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      ⚡ Parents HQ
                    </Link>
                  )}
                  
                  <div className="border-t border-gray-100 mt-1">
                    <Link 
                      href="/api/sign-out" 
                      className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Out
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-x-2">
              <Link 
                href="/sign-in" 
                className="px-4 py-2 text-sm text-black hover:bg-gray-100 rounded-full"
              >
                Sign In
              </Link>
              <Link 
                href="/sign-up" 
                className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 rounded-full"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
