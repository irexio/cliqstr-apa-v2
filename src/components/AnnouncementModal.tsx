'use client';

import { X } from 'lucide-react';

interface AnnouncementModalProps {
  announcement: {
    _id: string;
    title: string;
    message?: string;
    description?: string;
    createdAt?: number;
    [key: string]: any;
  } | null;
  onClose: () => void;
}

export default function AnnouncementModal({
  announcement,
  onClose,
}: AnnouncementModalProps) {
  if (!announcement) return null;

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{announcement.title}</h2>
            {announcement.createdAt && (
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(announcement.createdAt)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition flex-shrink-0 ml-4"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {announcement.message || announcement.description || 'No content'}
          </div>
        </div>

        {/* Footer with close button */}
        <div className="flex gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-900 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
