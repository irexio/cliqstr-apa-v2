'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from '@/components/ui/use-toast';

interface AnnouncementFormProps {
  cliqId?: string;
  cliqName?: string;
  isSuperadmin?: boolean;
  onSubmit: (data: AnnouncementFormData) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
  initialData?: AnnouncementFormData & { _id: string };
  isEditMode?: boolean;
}

export interface AnnouncementFormData {
  title: string;
  message: string;
  visibility: 'global' | 'cliq';
  cliqId?: string;
  pinned: boolean;
}

export default function AnnouncementForm({
  cliqId,
  cliqName,
  isSuperadmin = false,
  onSubmit,
  onClose,
  loading = false,
  initialData,
  isEditMode = false,
}: AnnouncementFormProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [visibility, setVisibility] = useState<'global' | 'cliq'>('cliq');
  const [pinned, setPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setMessage(initialData.message);
      setVisibility(initialData.visibility);
      setPinned(initialData.pinned);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Message is required',
      });
      return;
    }

    if (visibility === 'cliq' && !cliqId) {
      toast({
        title: 'Error',
        description: 'Cliq announcement requires a cliq',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        message: message.trim(),
        visibility,
        cliqId: visibility === 'cliq' ? cliqId : undefined,
        pinned,
      });

      toast({
        title: 'Success',
        description: isEditMode ? 'Announcement updated' : 'Announcement created',
      });

      onClose();
    } catch (error: any) {
      console.error('[AnnouncementForm] Error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save announcement',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditMode ? 'Edit Announcement' : 'Create Announcement'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Important Update"
              disabled={isSubmitting}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Enter announcement message"
              rows={4}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/500 characters
            </p>
          </div>

          {/* Visibility (only show for superadmin) */}
          {isSuperadmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="cliq"
                    checked={visibility === 'cliq'}
                    onChange={(e) => setVisibility(e.target.value as 'cliq' | 'global')}
                    disabled={isSubmitting}
                    className="w-4 h-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Cliq Only {cliqName && `(${cliqName})`}
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="global"
                    checked={visibility === 'global'}
                    onChange={(e) => setVisibility(e.target.value as 'cliq' | 'global')}
                    disabled={isSubmitting}
                    className="w-4 h-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Global (All Cliqs)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Pinned Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pinned"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4"
            />
            <label htmlFor="pinned" className="ml-2 text-sm text-gray-700">
              Pin announcement (don't auto-expire after 14 days)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isSubmitting
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                ? 'Update'
                : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
