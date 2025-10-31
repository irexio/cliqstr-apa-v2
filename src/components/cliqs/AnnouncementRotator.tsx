'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface RotatorItem {
  id: string;
  type: 'birthday' | 'event' | 'announcement';
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
  const [items, setItems] = useState<RotatorItem[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('[ROTATOR] Component mounted with cliqId:', cliqId);

  // Fetch all content (announcements, events, birthdays)
  useEffect(() => {
    console.log('[ROTATOR] useEffect running with cliqId:', cliqId);
    
    const fetchContent = async () => {
      try {
        console.log('[ROTATOR] Fetching announcements, events, and birthdays...');
        const res = await fetch(`/api/announcements/list?cliqId=${cliqId}`, {
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Failed to fetch content');

        const data = await res.json();
        let allItems = data.announcements || [];

        console.log('[ROTATOR] Raw API data length:', allItems.length);
        console.log('[ROTATOR] Raw API data:', JSON.stringify(allItems, null, 2));

        // Apply priority sort per Aiden's spec:
        // 1. Global announcements first
        // 2. Pinned items second
        // 3. Everything else by date (newest first)
        allItems.sort((a: any, b: any) => {
          // Global announcements first
          if (a.isGlobal && !b.isGlobal) return -1;
          if (!a.isGlobal && b.isGlobal) return 1;

          // Pinned items second
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;

          // Everything else by date (newest first)
          return (b.timestamp || 0) - (a.timestamp || 0);
        });

        setItems(allItems);
        console.log('[ROTATOR] ✅ Loaded', allItems.length, 'total items (announcements + events + birthdays)');
      } catch (err) {
        console.error('[ROTATOR] Error fetching:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [cliqId]);

  // Auto-rotate
  useEffect(() => {
    if (items.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(timer);
  }, [items.length]);

  if (loading || items.length === 0) return null;

  const current = items[currentIndex];

  const handleClick = () => {
    console.log('[ROTATOR] Click handler triggered on item:', {
      type: current.type,
      title: current.title,
      clickTarget: current.clickTarget,
      hasClickTarget: !!current.clickTarget,
    });
    
    if (current.clickTarget) {
      console.log('[ROTATOR] Navigating to:', current.clickTarget);
      router.push(current.clickTarget);
    } else {
      console.log('[ROTATOR] No clickTarget available for this item');
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
      {/* Content - seamless merged display */}
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
      {items.length > 1 && (
        <div className="flex gap-1 mt-2 justify-center">
          {items.map((_, idx) => (
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
