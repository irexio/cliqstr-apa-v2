'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import Link from 'next/link';
import CliqsGrid from '@/components/cliqs/CliqsGrid';
import { DashboardProfileNudge } from '@/components/ui/ProfileNudge';
import PlanGuard from '@/components/auth/PlanGuard';

export default function ClientView({ user }: { user: any }) {
  const cliqs = useQuery(api.cliqs.getUserCliqs, user?.id ? { userId: user.id as Id<'users'> } : 'skip');

  const formattedCliqs = cliqs ? cliqs.filter((c) => c !== null).map((c) => ({
    id: c._id,
    name: c.name,
    description: c.description || '',
    privacy: c.privacy,
    createdAt: new Date(c.createdAt).toISOString(),
    ownerId: c.ownerId,
    coverImage: c.coverImage,
  })) : [];

  const hasProfile = !!user.myProfile;
  const hasCliqs = formattedCliqs.length > 0;

  return (
    <PlanGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              {!hasProfile ? 'Welcome to Cliqstr' : 'My Cliqs'}
            </h1>
            <p className="text-gray-600 mt-2">
              {!hasProfile
                ? 'Create your profile and start connecting with family and friends.'
                : 'Manage your cliqs and invite friends to join.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={hasProfile ? '/profile/edit' : '/profile/create'}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              {hasProfile ? 'Edit Profile' : 'Create Profile'}
            </Link>

            <Link
              href="/cliqs/build"
              className="flex items-center gap-2 bg-black hover:text-[#c032d1] text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Create New Cliq
            </Link>
          </div>
        </div>

        {!hasCliqs ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="m22 21-3-3m0 0a5 5 0 1 0-7-7 5 5 0 0 0 7 7z"></path>
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {!hasProfile ? 'Welcome to Cliqstr!' : 'No Cliqs Yet'}
            </h3>

            <p className="text-gray-600 mb-8 max-w-md text-center">
              {!hasProfile
                ? 'Get started by creating your profile or jump right into creating your first cliq. You can always complete your profile later!'
                : 'Create your first cliq to start sharing with family and friends in a private, safe space.'}
            </p>

            <div className="text-sm text-gray-500 text-center">
              <p>Use the buttons above to get started</p>
              <p className="mt-1">👆 {hasProfile ? 'Create New Cliq' : 'Create Profile or Create New Cliq'}</p>
            </div>
          </div>
        ) : (
          <CliqsGrid initialCliqs={formattedCliqs} currentUserId={user.id} />
        )}

        {hasCliqs && (
          <div className="mt-8">
            <DashboardProfileNudge profile={user.myProfile} />
          </div>
        )}
        </div>
      </div>
    </PlanGuard>
  );
}


