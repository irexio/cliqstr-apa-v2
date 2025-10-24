'use client';

import React, { useState } from 'react';

interface RsvpButtonsProps {
  currentStatus?: 'going' | 'maybe' | 'raincheck';
  onRsvp: (status: 'going' | 'maybe' | 'raincheck') => Promise<void>;
  loading?: boolean;
}

export default function RsvpButtons({
  currentStatus,
  onRsvp,
  loading = false,
}: RsvpButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRsvp = async (status: 'going' | 'maybe' | 'raincheck') => {
    setIsLoading(true);
    try {
      await onRsvp(status);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => handleRsvp('going')}
        disabled={isLoading || loading}
        className={`px-4 py-2 rounded font-medium transition ${
          currentStatus === 'going'
            ? 'bg-green-600 text-white'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        } disabled:opacity-50`}
      >
        ✓ Going
      </button>

      <button
        onClick={() => handleRsvp('maybe')}
        disabled={isLoading || loading}
        className={`px-4 py-2 rounded font-medium transition ${
          currentStatus === 'maybe'
            ? 'bg-yellow-600 text-white'
            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
        } disabled:opacity-50`}
      >
        ? Maybe
      </button>

      <button
        onClick={() => handleRsvp('raincheck')}
        disabled={isLoading || loading}
        className={`px-4 py-2 rounded font-medium transition ${
          currentStatus === 'raincheck'
            ? 'bg-gray-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } disabled:opacity-50`}
      >
        ✕ Raincheck
      </button>
    </div>
  );
}
