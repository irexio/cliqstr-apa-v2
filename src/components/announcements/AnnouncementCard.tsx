'use client';

import { useState } from 'react';
import { Trash2, Pin } from 'lucide-react';
import toast from '@/components/ui/use-toast';

interface Announcement {
  _id: string;
  title: string;
  message: string;
  createdAt: number;
  pinned: boolean;
  visibility: 'global' | 'cliq';
  createdByUserId: string;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  canDelete: boolean;
  onDelete?: (announcementId: string) => Promise<void>;
}

export default function AnnouncementCard({
  announcement,
  canDelete,
  onDelete,
}: AnnouncementCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;

    if (!window.confirm('Delete this announcement?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(announcement._id);
      toast({
        title: 'Success',
        description: 'Announcement deleted',
      });
    } catch (error: any) {
      console.error('[AnnouncementCard] Error deleting:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete announcement',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = new Date(announcement.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: announcement.createdAt < Date.now() - 365 * 24 * 60 * 60 * 1000 ? 'numeric' : undefined,
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title with pinned indicator */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {announcement.title}
            </h3>
            {announcement.pinned && (
              <Pin size={14} className="text-yellow-500 flex-shrink-0" />
            )}
            {announcement.visibility === 'global' && (
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded flex-shrink-0">
                Global
              </span>
            )}
          </div>

          {/* Message */}
          <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap break-words">
            {announcement.message}
          </p>

          {/* Date */}
          <p className="text-xs text-gray-500">
            Posted {formattedDate}
          </p>
        </div>

        {/* Delete Button */}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 text-gray-600 hover:text-red-600 flex-shrink-0"
            title="Delete announcement"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
