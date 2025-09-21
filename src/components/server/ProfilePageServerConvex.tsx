'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { notFound, redirect } from 'next/navigation';
import ProfileClientWrapper from '@/app/profile/[username]/ProfileClient';
import { useAuth } from '@/lib/auth/useAuth';
import { useEffect } from 'react';

interface ProfilePageServerConvexProps {
  username: string;
}

export default function ProfilePageServerConvex({ username }: ProfilePageServerConvexProps) {
  const { user, isLoading } = useAuth();
  
  // Get the target profile
  const profile = useQuery(api.profiles.getProfileByUsername, { username });
  
  // Get scrapbook items
  const scrapbookItems = useQuery(
    api.scrapbook.getScrapbookItems,
    profile ? { profileId: profile._id } : "skip"
  );

  // Check if users share any cliqs (only if viewing someone else's profile)
  const hasSharedCliq = useQuery(
    api.profiles.checkSharedCliqMembership,
    user?.id && profile && profile.userId !== user.id
      ? { userId1: user.id as Id<"users">, userId2: profile.userId as Id<"users"> }
      : "skip"
  );

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Handle unauthenticated users
  if (!user?.id) {
    redirect('/sign-in');
  }

  // Handle profile not found
  if (profile === null) {
    return notFound();
  }

  // Handle still loading profile
  if (profile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // APA-compliant access control: Check if users share at least one cliq
  // Skip this check if the user is viewing their own profile
  if (profile.userId !== user.id) {
    // Still loading shared cliq check
    if (hasSharedCliq === undefined) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // Users don't share any cliqs, so they shouldn't see each other's profiles
    if (!hasSharedCliq) {
      return notFound();
    }
  }

  const isOwner = profile.userId === user.id;
  
  const profileData = {
    id: profile._id,
    name: `${profile.account?.firstName || ''} ${profile.account?.lastName || ''}`.trim() || profile.username,
    username: profile.username,
    birthdate: profile.account?.birthdate ? new Date(profile.account.birthdate).toISOString() : undefined,
    bio: profile.about || '',
    avatarUrl: profile.image || undefined,
    bannerUrl: profile.bannerImage || undefined,
    isOwner,
    canViewGallery: true, // Since they share a cliq, they can view the gallery
    showYear: profile.showYear || false,
    galleryLayoutStyle: 'inline' as const,
    // Include Account data for age verification (optional for backward compatibility)
    accountBirthdate: profile.account?.birthdate,
    accountRole: profile.account?.role,
  };

  // Transform scrapbook items to match expected format
  const formattedScrapbookItems = scrapbookItems?.map(item => ({
    id: item._id,
    imageUrl: item.imageUrl,
    caption: item.caption,
    isPinned: item.isPinned,
    createdAt: new Date(item.createdAt).toISOString(),
    updatedAt: new Date(item.updatedAt).toISOString(),
  })) || [];

  return (
    <ProfileClientWrapper
      initialProfile={profileData}
      initialScrapbookItems={formattedScrapbookItems}
    />
  );
}

