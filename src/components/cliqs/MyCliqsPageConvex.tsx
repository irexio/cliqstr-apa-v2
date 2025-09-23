'use client';

// 🔐 APA-HARDENED — MyCliqsPage (using Convex)

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import CliqsGrid from '@/components/cliqs/CliqsGrid';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth/useAuth';

export default function MyCliqsPageConvex() {
  const { user, isLoading } = useAuth();
  
  // Get user's cliqs using Convex
  const cliqs = useQuery(api.cliqs.getUserCliqs, 
    user?.id ? { userId: user.id as Id<"users"> } : "skip"
  );

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="pt-12 pb-8 max-w-2xl mx-auto flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4 text-center">Please log in</h1>
        <p className="text-lg text-neutral-700 mb-8 text-center">
          You need to be logged in to view your cliqs.
        </p>
        <Link href="/sign-in">
          <Button className="bg-black text-white hover:bg-gray-900">Sign In</Button>
        </Link>
      </div>
    );
  }

  if (!cliqs || cliqs.length === 0) {
    return (
      <div className="pt-12 pb-8 max-w-2xl mx-auto flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4 text-center">Welcome to Cliqstr!</h1>
        <p className="text-lg text-neutral-700 mb-8 text-center">
          Let's get you started — create a profile or start your first cliq.
        </p>
        <div className="flex flex-row gap-6 justify-center">
          <Link href="/profile/create">
            <Button className="bg-black text-white hover:bg-gray-900">Create Your Profile</Button>
          </Link>
          <Link href="/cliqs/build">
            <Button className="bg-black text-white hover:bg-gray-900">Create New Cliq</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Transform Convex data to match expected format
  const formattedCliqs = cliqs.filter(cliq => cliq !== null).map(cliq => ({
    id: cliq._id,
    name: cliq.name,
    description: cliq.description || '',
    privacy: cliq.privacy,
    createdAt: new Date(cliq.createdAt).toISOString(),
    ownerId: cliq.ownerId,
    coverImage: cliq.coverImage,
    bannerImage: cliq.coverImage, // Use coverImage as bannerImage
  }));

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">My Cliqs</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Manage your cliqs and invite friends to join.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/profile/edit">
              <Button variant="outline" className="w-full sm:w-auto">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Edit Profile
              </Button>
            </Link>
            <Link href="/cliqs/build">
              <Button className="w-full sm:w-auto">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Cliq
              </Button>
            </Link>
          </div>
        </div>
      
      {/* Cliqs Grid */}
      <CliqsGrid initialCliqs={formattedCliqs} currentUserId={user.id} />
    </div>
  );
}

