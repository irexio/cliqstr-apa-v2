'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface Announcement {
  id: string;
  type: 'birthday' | 'event' | 'announcement' | 'notice';
  title: string;
  description: string;
  timestamp: number;
  clickTarget?: string;
  isGlobal?: boolean;
  pinned?: boolean;
}

interface AnnouncementRotatorProps {
  cliqId: string;
}

export default function AnnouncementRotator({ cliqId }: AnnouncementRotatorProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortedItems, setSortedItems] = useState<Announcement[]>([]);

  // Fetch announcements directly from Convex query
  const convexAnnouncements = useQuery(api.announcements.listActiveAnnouncements, {
    cliqId: cliqId as Id<'cliqs'>,
  });

  // Process and sort announcements whenever data changes
  useEffect(() => {
    if (!convexAnnouncements) {
      console.log('[ROTATOR] Loading announcements...');
      return;
    }

    const items: Announcement[] = convexAnnouncements.map((ann: any) => ({
      id: ann._id.toString(),
      type: 'announcement',
      title: ann.title,
      description: ann.message,
      timestamp: ann.createdAt,
      isGlobal: ann.visibility === 'global',
      pinned: ann.pinned,
    }));

    // Apply priority sort per Aiden's spec:
    // 1. Global announcements first
    // 2. Pinned items second
    // 3. Everything else by date (newest first)
    items.sort((a: any, b: any) => {
      // Global announcements first
      if (a.isGlobal && !b.isGlobal) return -1;
      if (!a.isGlobal && b.isGlobal) return 1;

      // Pinned items second
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Everything else by date (newest first)
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    setSortedItems(items);
    console.log('[ROTATOR] Loaded', items.length, 'announcements from Convex (sorted by priority)');
  }, [convexAnnouncements]);

  // Auto-rotate
  useEffect(() => {
    if (sortedItems.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedItems.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(timer);
  }, [sortedItems.length]);

  if (!convexAnnouncements || sortedItems.length === 0) return null;

  const current = sortedItems[currentIndex];

  const handleClick = () => {
    if (current.clickTarget) {
      router.push(current.clickTarget);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-black text-white rounded-lg p-3 mb-6 cursor-pointer transition hover:bg-gray-900 ${
        current.clickTarget ? 'hover:shadow-lg' : ''
      }`}
      style={{ minHeight: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
      {/* Announcement content - seamless merged display */}
      <div className="text-sm sm:text-base">
        {current.type === 'announcement' && (
          <span className="font-semibold">{current.title}: </span>
        )}
        {current.type !== 'announcement' && (
          <p className="font-medium truncate">{current.title}</p>
        )}
      </div>

      {current.description && (
        <p className="text-xs text-gray-300 mt-1 truncate">{current.description}</p>
      )}

      {/* Dot indicators */}
      {sortedItems.length > 1 && (
        <div className="flex gap-1 mt-2 justify-center">
          {sortedItems.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition ${
                idx === currentIndex ? 'bg-white w-4' : 'bg-gray-600 w-1.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
