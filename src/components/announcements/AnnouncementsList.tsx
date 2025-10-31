'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useState } from 'react';
import AnnouncementCard from './AnnouncementCard';
import toast from '@/components/ui/use-toast';

interface AnnouncementListProps {
  cliqId: string;
  canDeleteAnnouncements: boolean; // true for owner/superadmin
  userId?: string;
}

export default function AnnouncementsList({
  cliqId,
  canDeleteAnnouncements,
  userId,
}: AnnouncementListProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch active announcements using Convex query
  const announcements = useQuery(api.announcements.listActiveAnnouncements, {
    cliqId: cliqId as Id<'cliqs'>,
  });

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const response = await fetch('/api/announcements/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete announcement');
      }

      // Trigger a refetch by changing the key
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error('[AnnouncementsList] Error deleting:', error);
      throw error;
    }
  };

  // Loading state
  if (announcements === undefined) {
    return null; // Still loading, render nothing
  }

  // No announcements
  if (!announcements || announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
        <span className="text-sm text-gray-500">{announcements.length} active</span>
      </div>

      {/* Announcement Cards */}
      <div key={refreshKey} className="space-y-2">
        {announcements.map((announcement) => (
          <AnnouncementCard
            key={announcement._id}
            announcement={announcement}
            canDelete={canDeleteAnnouncements}
            onDelete={handleDeleteAnnouncement}
          />
        ))}
      </div>
    </div>
  );
}
