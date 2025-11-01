'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// Type declaration for window.debugLog
declare global {
  interface Window {
    debugLog?: (...args: any[]) => void;
  }
}

// Force logs to be visible even in minified builds
if (typeof window !== 'undefined' && !window.debugLog) {
  window.debugLog = function(...args: any[]) {
    console.log(...args);
  };
}

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
  const [debugInfo, setDebugInfo] = useState('Component mounted. cliqId: ' + cliqId);

  window.debugLog?.('[ROTATOR] Component rendered with cliqId prop:', cliqId);

  // Fetch all content (announcements, events, birthdays)
  useEffect(() => {
    window.debugLog?.('[ROTATOR] useEffect triggered with cliqId:', cliqId);
    setDebugInfo('Fetching from /api/announcements/list?cliqId=' + cliqId);
    
    const fetchContent = async () => {
      try {
        window.debugLog?.('[ROTATOR] Starting fetch for cliqId:', cliqId);
        const res = await fetch(`/api/announcements/list?cliqId=${cliqId}`, {
          credentials: 'include',
        });

        window.debugLog?.('[ROTATOR] Fetch response status:', res.status, res.statusText);
        setDebugInfo(`Fetch response: ${res.status} ${res.statusText}`);

        if (!res.ok) {
          const errorData = await res.text();
          window.debugLog?.('[ROTATOR] Fetch failed:', {
            status: res.status,
            statusText: res.statusText,
            errorData
          });
          setDebugInfo(`ERROR: ${res.status} - ${errorData}`);
          throw new Error(`Failed to fetch content: ${res.status}`);
        }

        const data = await res.json();
        window.debugLog?.('[ROTATOR] Response data:', data);
        setDebugInfo(`Got data: ${JSON.stringify(data).substring(0, 100)}...`);
        
        let allItems = data.announcements || [];
        window.debugLog?.('[ROTATOR] Items before sort:', allItems.length);
        setDebugInfo(`Items: ${allItems.length}`);

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

        window.debugLog?.('[ROTATOR] Items after sort:', allItems.length);
        setDebugInfo(`Sorted: ${allItems.length} items`);
        setItems(allItems);
      } catch (err) {
        window.debugLog?.('[ROTATOR] Error fetching:', err);
        setDebugInfo(`ERROR: ${String(err)}`);
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

  if (loading || items.length === 0) {
    return (
      <div className="bg-red-100 border border-red-300 text-red-800 p-3 mb-6 rounded-lg text-sm">
        <strong>[ROTATOR DEBUG]</strong> {debugInfo}
      </div>
    );
  }

  const current = items[currentIndex];

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
