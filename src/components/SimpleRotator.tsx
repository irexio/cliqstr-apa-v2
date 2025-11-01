'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RotatorItem {
  _id: string;
  type?: string;
  title: string;
  message?: string;
  visibility?: string;
  isGlobal?: boolean;
  [key: string]: any;
}

interface SimpleRotatorProps {
  items: RotatorItem[];
  loading?: boolean;
}

export default function SimpleRotator({ items, loading }: SimpleRotatorProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate
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

  return (
    <div className="bg-black text-white rounded-lg p-4 mb-6 cursor-pointer hover:bg-gray-900 transition">
      <div className="text-sm font-semibold mb-1">{current.title}</div>
      {current.message && (
        <div className="text-xs text-gray-300 mb-2">{current.message}</div>
      )}
      
      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="flex gap-1 justify-center mt-2">
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
