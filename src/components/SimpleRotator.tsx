'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RotatorItem {
  _id: string;
  _type?: 'announcement' | 'event' | 'birthday';
  title: string;
  message?: string;
  description?: string;
  startAt?: number;
  endAt?: number;
  timezone?: string;
  visibility?: string;
  rsvps?: Record<string, string>;
  [key: string]: any;
}

interface SimpleRotatorProps {
  items: RotatorItem[];
  loading?: boolean;
  cliqId?: string;
}

export default function SimpleRotator({ items, loading, cliqId }: SimpleRotatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (!items || items.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [items.length]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-100 text-gray-600 rounded-lg p-3 mb-6">
        Loading announcements...
      </div>
    );
  }

  // No items
  if (!items || items.length === 0) {
    return null;
  }

  const current = items[currentIndex];
  if (!current) return null;

  const itemType = current._type || 'announcement';
  
  // Format date/time for events
  const formatEventTime = (timestamp: number, timezone: string = 'UTC') => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-black text-white rounded-lg p-3 mb-6">
      {/* Title */}
      <div className="text-sm font-semibold mb-1">{current.title}</div>

      {/* Description/Message */}
      {(current.message || current.description) && (
        <div className="text-xs text-gray-300 mb-2 line-clamp-2">
          {current.message || current.description}
        </div>
      )}

      {/* Event-specific details */}
      {itemType === 'event' && current.startAt && (
        <div className="text-xs text-gray-400 mb-2 space-y-0.5">
          <div>📅 {formatEventTime(current.startAt, current.timezone)}</div>
          {current.location && (
            <div>📍 {current.location}</div>
          )}
        </div>
      )}

      {/* Action Link */}
      <div className="text-xs mb-2">
        {itemType === 'event' && current._id && (
          <Link
            href={`/calendar?eventId=${current._id}&cliqId=${cliqId}`}
            className="text-white hover:text-gray-300 transition"
          >
            Tap to RSVP in Calendar
          </Link>
        )}
        
        {itemType === 'announcement' && (
          <Link
            href="#"
            className="text-white hover:text-gray-300 transition"
          >
            View Details
          </Link>
        )}
      </div>

      {/* Dot indicators for rotation */}
      {items.length > 1 && (
        <div className="flex gap-1 justify-center mt-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition ${
                idx === currentIndex ? 'bg-white w-4' : 'bg-gray-600 w-1.5'
              }`}
              aria-label={`Show item ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
