"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import CliqProfileContent from '@/components/cliqs/CliqProfileContent';
import PostForm from '@/components/PostForm';
import CliqFeedConvex from '@/components/cliqs/CliqFeedConvex';
import CliqTools from '@/components/cliqs/CliqTools';
import CliqNoticeBar from '@/components/cliqs/CliqNoticeBar';
import { useAuth } from '@/lib/auth/useAuth';
import { notFound } from 'next/navigation';
import { useEffect } from 'react';

interface CliqPageConvexProps {
  cliqId: string;
}

export default function CliqPageConvex({ cliqId }: CliqPageConvexProps) {
  const { user, isLoading: authLoading } = useAuth();
  
  // Get cliq data with membership check
  const cliq = useQuery(api.cliqs.getCliq, 
    user?.id ? { 
      cliqId: cliqId as Id<"cliqs">, 
      userId: user.id as Id<"users"> 
    } : "skip"
  );
  
  // Get posts for this cliq
  const posts = useQuery(api.posts.getCliqPosts,
    user?.id ? {
      cliqId: cliqId as Id<"cliqs">,
      userId: user.id as Id<"users">
    } : "skip"
  );

  // Get cliq members for member count
  const members = useQuery(api.cliqs.getCliqMembers,
    user?.id ? { cliqId: cliqId as Id<"cliqs"> } : "skip"
  );

  // Debug logging for cliq page issues
  console.log('CliqPageConvex Debug:', {
    cliqId,
    userId: user?.id,
    cliq: cliq,
    posts: posts,
    postsLength: posts?.length,
    authLoading,
    user: user ? {
      id: user.id,
      email: user.email,
      role: user.role
    } : null
  });

  // Loading state
  if (authLoading) {
    return (
      <main className="p-6 max-w-xl mx-auto text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </main>
    );
  }

  // Not authenticated
  if (!user?.id) {
    return notFound();
  }

  // Cliq not found or not authorized
  if (cliq === null) {
    return (
      <main className="p-6 max-w-xl mx-auto text-center text-red-500 font-medium">
        You do not have access to this cliq. Please ask the owner to invite you.
      </main>
    );
  }

  // Still loading cliq data
  if (cliq === undefined) {
    return (
      <main className="p-6 max-w-xl mx-auto text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading cliq...</p>
      </main>
    );
  }

  // Extract only the fields needed for CliqProfileContent
  const cliqProfile = {
    name: cliq.name,
    description: cliq.description || undefined,
    bannerImage: cliq.coverImage || undefined,
    privacy: cliq.privacy,
    memberCount: members?.length || 0,
    ownerId: cliq.ownerId,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Cliq Notice Bar */}
        <CliqNoticeBar cliqId={cliqId} />
        
        {/* Cliq Profile Content */}
        <CliqProfileContent cliq={cliqProfile} cliqId={cliqId} />
        
        {/* Post Form */}
        <PostForm cliqId={cliqId} />
        
        {/* Cliq Feed */}
        <CliqFeedConvex cliqId={cliqId} posts={posts} showPostForm={false} />
        
        {/* Cliq Tools */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <CliqTools cliqId={cliqId} />
        </div>
      </div>
    </main>
  );
}

