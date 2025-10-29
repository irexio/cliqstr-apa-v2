'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface EventFormProps {
  cliqId?: string;
  cliqName?: string;
  onSubmit: (data: ActivityFormData) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

export interface ActivityFormData {
  cliqId: string;
  title: string;
  description: string;
  startAt: number;
  endAt: number;
  timezone: string;
  location: string;
  recurrenceRule?: string;
  emoji?: string; // NEW: Optional emoji for special occasions
}

export default function EventForm({
  cliqId,
  cliqName,
  onSubmit,
  onClose,
  loading = false,
}: EventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:00');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [recurrence, setRecurrence] = useState('none');
  const [emoji, setEmoji] = useState(''); // NEW: emoji state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const holidays = [
    { emoji: '🎄', label: 'Christmas' },
    { emoji: '🦃', label: 'Thanksgiving' },
    { emoji: '🐰', label: 'Easter' },
    { emoji: '🎆', label: '4th of July' },
    { emoji: '🎂', label: 'Birthday' },
    { emoji: '🎃', label: 'Halloween' },
    { emoji: '🎒', label: 'Back To School' },
    { emoji: '🎓', label: 'Graduation' },
    { emoji: '🎉', label: 'Party' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[EventForm handleSubmit] Called with:', { cliqId, title, date });
    
    // Validate required fields
    if (!cliqId) {
      console.error('[EventForm] Missing cliqId');
      alert('Error: No cliqId provided to form');
      return;
    }
    
    if (!title.trim()) {
      console.error('[EventForm] Missing title');
      alert('Error: Please enter a title');
      return;
    }
    
    if (!date) {
      console.error('[EventForm] Missing date');
      alert('Error: Please select a date');
      return;
    }

    const [startHour, startMin] = startTime.split(':');
    const [endHour, endMin] = endTime.split(':');

    // RELIABLE timezone conversion: 
    // Create times as if they were in the target timezone, then convert to UTC
    // Step 1: Create a test date in UTC
    const testDateUtc = new Date(`${date}T12:00:00Z`);
    
    // Step 2: Format it in the target timezone to find the offset
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(testDateUtc);
    const tzDate = new Date(
      parseInt(parts.find(p => p.type === 'year')?.value || '2025'),
      parseInt(parts.find(p => p.type === 'month')?.value || '01') - 1,
      parseInt(parts.find(p => p.type === 'day')?.value || '01'),
      parseInt(parts.find(p => p.type === 'hour')?.value || '12'),
      parseInt(parts.find(p => p.type === 'minute')?.value || '00'),
      parseInt(parts.find(p => p.type === 'second')?.value || '00')
    );
    
    // Step 3: Calculate the offset between UTC time and how it appears in target timezone
    const offsetMs = testDateUtc.getTime() - tzDate.getTime();
    
    // Step 4: Now create the actual times the user entered
    // Parse the date from the input (YYYY-MM-DD format)
    const [year, month, day] = date.split('-').map(Number);
    
    // Create a date in the user's LOCAL timezone (not UTC) with user's times
    const localStartDate = new Date(year, month - 1, day, parseInt(startHour), parseInt(startMin), 0);
    const localEndDate = new Date(year, month - 1, day, parseInt(endHour), parseInt(endMin), 0);
    
    // Step 5: Adjust by the offset to get UTC
    // If timezone is behind UTC (negative offset like LA), we ADD to convert to UTC
    // If timezone is ahead of UTC (positive offset like Tokyo), we SUBTRACT
    const startAt = new Date(localStartDate.getTime() + offsetMs);
    const endAt = new Date(localEndDate.getTime() + offsetMs);

    setIsSubmitting(true);
    try {
      const formData = {
        cliqId,
        title: emoji ? `${emoji} ${title.trim()}` : title.trim(),
        description: description.trim(),
        startAt: startAt.getTime(),
        endAt: endAt.getTime(),
        timezone,
        location: location.trim(),
        recurrenceRule: recurrence !== 'none' ? `FREQ=${recurrence.toUpperCase()};COUNT=4` : undefined,
      };

      console.log('[EventForm] Submitting:', formData);
      
      await onSubmit(formData);
      console.log('[EventForm] onSubmit completed successfully');
    } catch (error) {
      console.error('[EventForm] Submission error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-0">
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b z-10">
          <h2 className="text-xl font-bold text-gray-900">Create Activity</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-black transition text-2xl font-light"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {cliqName && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm text-gray-900">
              <p className="font-medium mb-2">💡 Tip:</p>
              <p>Create recurring events to avoid scheduling conflicts.</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Park Meetup"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about the event..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Date and Timezone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option>America/New_York</option>
                <option>America/Los_Angeles</option>
                <option>America/Chicago</option>
                <option>America/Denver</option>
                <option>Europe/London</option>
                <option>Europe/Paris</option>
                <option>Asia/Tokyo</option>
              </select>
            </div>
          </div>

          {/* Start and End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Central Park"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Holiday Emoji Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Occasion (Optional)
            </label>
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setEmoji('')}
                className={`p-2 rounded text-xl transition ${
                  emoji === '' ? 'bg-black text-white border-2 border-black' : 'bg-gray-100 border-2 border-gray-200'
                }`}
                title="None"
                disabled={isSubmitting}
              >
                ✗
              </button>
              {holidays.map((h) => (
                <button
                  key={h.emoji}
                  type="button"
                  onClick={() => setEmoji(h.emoji)}
                  className={`p-2 rounded text-xl transition ${
                    emoji === h.emoji ? 'bg-black text-white border-2 border-black' : 'bg-gray-100 border-2 border-gray-200'
                  }`}
                  title={h.label}
                  disabled={isSubmitting}
                >
                  {h.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Repeat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repeat
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="none">No Repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Action Buttons - Sticky */}
          <div className="flex gap-3 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title || !date}
              className="flex-1 bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
