'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Announcement {
  id: string;
  type: 'birthday' | 'event' | 'announcement' | 'notice';
  title: string;
  description: string;
  timestamp: number;
  clickTarget?: string;
}

interface AnnouncementRotatorProps {
  cliqId: string;
}

export default function AnnouncementRotator({ cliqId }: AnnouncementRotatorProps) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`/api/announcements/list?cliqId=${cliqId}`, {
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Failed to fetch announcements');

        const data = await res.json();
        let items = data.announcements || [];
        
        // Apply priority sort order per Aiden's spec:
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
        
        setAnnouncements(items);
        console.log('[ROTATOR] Loaded', items.length, 'announcements (sorted by priority)');
      } catch (err) {
        console.error('[ROTATOR] Error fetching:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [cliqId]);

  // Auto-rotate
  useEffect(() => {
    if (announcements.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(timer);
  }, [announcements.length]);

  if (loading || announcements.length === 0) return null;

  const current = announcements[currentIndex];

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
      {announcements.length > 1 && (
        <div className="flex gap-1 mt-2 justify-center">
          {announcements.map((_, idx) => (
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
