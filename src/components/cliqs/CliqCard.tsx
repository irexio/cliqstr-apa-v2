'use client';

// 🔐 APA-HARDENED — Cliq Card for Dashboard View
import Link from 'next/link';
import Image from 'next/image';
import BaseCard from './BaseCard';
import { CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/Button';
import InviteModal from '@/components/cliqs/InviteModal';
import MembersModal from '@/components/cliqs/MembersModal';
import CliqManageModal from '@/components/cliqs/CliqManageModal';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CliqCardProps {
  cliq: {
    id: string;
    name: string;
    description?: string | null;
    privacy: string;
    coverImage?: string | null;
    ownerId?: string;
  };
  currentUserId?: string;
  onDelete?: (cliqId: string) => void;
}

export default function CliqCard({ cliq, currentUserId, onDelete }: CliqCardProps) {
  const router = useRouter();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  // Check if current user is the owner
  const isOwner = currentUserId && cliq.ownerId === currentUserId;
  const canInvite = !!isOwner || cliq.privacy === 'public';
  
  // Debug logging
  console.log('CliqCard Debug:', {
    cliqId: cliq.id,
    cliqName: cliq.name,
    currentUserId,
    cliqOwnerId: cliq.ownerId,
    isOwner,
    hasOnDelete: !!onDelete
  });

  const shouldIgnore = (target: HTMLElement) =>
    !!target.closest('a, button, [role="button"], input, textarea, select');

  const handleCardClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // On mobile, ensure taps anywhere on the card navigate, except on interactive elements
    const target = e.target as HTMLElement;
    if (shouldIgnore(target)) return;
    router.push(`/cliqs/${cliq.id}`);
  };

  const handleCardTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement;
    if (shouldIgnore(target)) return;
    router.push(`/cliqs/${cliq.id}`);
  };

  return (
    <BaseCard className="p-0 group hover:shadow-lg transition-shadow relative cursor-pointer" onClick={handleCardClick} onTouchEnd={handleCardTouchEnd}>
      {/* Card Clickable Area */}
      <Link href={`/cliqs/${cliq.id}`} className="block focus:outline-none focus:ring-2 focus:ring-primary">
        {/* Cover Image or Gradient */}
        {cliq.coverImage ? (
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src={cliq.coverImage}
              alt={`${cliq.name} banner image`}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300" />
        )}
        <div className="p-6">
          <CardTitle className="text-xl font-bold mb-1">{cliq.name}</CardTitle>
          <p className="text-sm text-gray-500 mb-3 capitalize">{cliq.privacy} Cliq</p>
          <p className="text-sm text-gray-600 line-clamp-2">
            {cliq.description || 'I like to socialize in private. You? If so, welcome to Cliqstr.com'}
          </p>
        </div>
      </Link>
      {/* Action Buttons */}
      <div className="flex items-center justify-between px-6 pb-6">
        {/* View Button */}
        <Link href={`/cliqs/${cliq.id}`} className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <span className="text-sm font-medium">View</span>
        </Link>

        {/* Invite Button */}
        {canInvite && (
          <button onClick={() => setInviteModalOpen(true)} className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span className="text-sm font-medium">Invite</span>
          </button>
        )}

        {/* Manage/Members Button */}
        <Link
          href={`/cliqs/${cliq.id}/members`}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          {isOwner ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1.51 1.51 1.65 1.65 0 0 0-.33 1.82l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82"></path>
              </svg>
              <span className="text-sm font-medium">Manage</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span className="text-sm font-medium">Members</span>
            </>
          )}
        </Link>
      </div>
      {canInvite && (
        <InviteModal
          cliqId={cliq.id}
          open={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          canInvite={canInvite}
        />
      )}
      <MembersModal cliqId={cliq.id} open={membersModalOpen} onClose={() => setMembersModalOpen(false)} isOwner={!!isOwner} />
      <CliqManageModal
        cliq={cliq}
        open={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        onDelete={onDelete}
        onOpenMembers={() => setMembersModalOpen(true)}
        isOwner={!!isOwner}
      />
    </BaseCard>
  );
}
