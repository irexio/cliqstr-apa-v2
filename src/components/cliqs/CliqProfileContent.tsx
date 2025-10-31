'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import InviteModal from './InviteModal';
import AnnouncementForm, { AnnouncementFormData } from '@/components/announcements/AnnouncementForm';

// 🔐 APA-HARDENED — Cliq Profile Client Component
// Renders cliq info passed from server (name, description, etc.)
// No API call — uses props only

interface CliqProfile {
  name: string;
  description?: string;
  bannerImage?: string;
  privacy?: string;
  memberCount?: number;
  ownerId?: string;
}

interface CliqProfileContentProps {
  cliq: CliqProfile;
  cliqId: string;
}

export default function CliqProfileContent({ cliq, cliqId }: CliqProfileContentProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);

  // Check if user can invite (owner or public cliq member)
  const isOwner = user?.id === cliq.ownerId;
  const canInvite = user?.id && (isOwner || cliq.privacy === 'public' || cliq.privacy === 'semi_private');
  
  // Check if user can create announcements (owner or superadmin)
  const isSuperadmin = user?.role === 'superadmin'; // TODO: Update based on actual superadmin check
  const canCreateAnnouncements = isOwner || isSuperadmin;

  // Debug logging
  console.log('[CliqProfileContent] Debug:', {
    userId: user?.id,
    cliqOwnerId: cliq.ownerId,
    isOwner,
    isSuperadmin,
    canCreateAnnouncements,
    cliqId,
    userName: user?.email,
  });

  const handleCreateAnnouncement = async (data: AnnouncementFormData) => {
    try {
      const response = await fetch('/api/announcements/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create announcement');
      }

      // Success - modal will close automatically via AnnouncementForm
      // Optionally: trigger a refetch of announcements here if needed
    } catch (error) {
      console.error('[CliqProfileContent] Error creating announcement:', error);
      throw error;
    }
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        {/* Banner Image - Full Width */}
        {cliq.bannerImage && (
          <img
            src={cliq.bannerImage}
            alt="Cliq banner"
            className="w-full h-48 object-cover rounded-t-xl"
          />
        )}
        
        {/* Cliq Info Card - Same Width as Banner */}
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{cliq.name}</h1>
                {cliq.description && <p className="text-gray-600">{cliq.description}</p>}
              </div>
              <div className="flex gap-2">
                {isOwner && (
                  <button
                    onClick={() => router.push(`/cliqs/${cliqId}/edit`)}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Edit Cliq
                  </button>
                )}
                {canCreateAnnouncements && (
                  <button
                    onClick={() => setAnnouncementModalOpen(true)}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    + Announcement
                  </button>
                )}
                {canInvite && (
                  <button
                    onClick={() => setInviteModalOpen(true)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Invite
                  </button>
                )}
              </div>
            </div>
            
            {/* Cliq Status */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="font-medium">
                  {cliq.privacy === 'private' ? 'Private' : 
                   cliq.privacy === 'public' ? 'Public' : 
                   cliq.privacy === 'semi_private' ? 'Semi-Private' : 'Private'} Cliq
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span>{cliq.memberCount || 0} members</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Invite Modal */}
      <InviteModal
        cliqId={cliqId}
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        canInvite={canInvite}
      />

      {/* Announcement Modal */}
      {announcementModalOpen && (
        <AnnouncementForm
          cliqId={cliqId}
          cliqName={cliq.name}
          isSuperadmin={isSuperadmin}
          onSubmit={handleCreateAnnouncement}
          onClose={() => setAnnouncementModalOpen(false)}
          isEditMode={false}
        />
      )}
    </>
  );
}

