'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DateTime } from 'luxon';
import CalendarView from '@/components/calendar/CalendarView';
import EventCard from '@/components/calendar/EventCard';
import EventForm, { ActivityFormData } from '@/components/calendar/EventForm';
import toast from '@/components/ui/use-toast';

interface Activity {
  _id: string;
  title: string;
  description?: string;
  startAt: number;
  endAt: number;
  timezone?: string;
  location?: string;
  locationVisibility?: string;
  requiresParentApproval?: boolean;
  rsvps?: Record<string, string>;
  createdByUserId?: string;
}

interface Cliq {
  _id: string;
  name: string;
  description?: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // CRITICAL: cliqId MUST come from URL, read it immediately
  const [urlCliqId, setUrlCliqId] = useState<string | null>(null);
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedCliqName, setSelectedCliqName] = useState<string>('');
  const [view, setView] = useState<'month' | 'week'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [session, setSession] = useState<any>(null);
  const [initialMonth, setInitialMonth] = useState<Date | null>(null);

  // On mount, read cliqId from window.location and check session
  useEffect(() => {
    setMounted(true);
    
    // Read cliqId and eventId from URL
    if (typeof window !== 'undefined') {
      const fullUrl = window.location.href;
      console.log('[CALENDAR] Full URL:', fullUrl);
      
      const cliqMatch = fullUrl.match(/[?&]cliqId=([^&]+)/);
      const cliqId = cliqMatch ? cliqMatch[1] : null;
      
      const eventMatch = fullUrl.match(/[?&]eventId=([^&]+)/);
      const eventId = eventMatch ? eventMatch[1] : null;
      
      console.log('[CALENDAR] Extracted cliqId:', cliqId, 'eventId:', eventId);
      setUrlCliqId(cliqId);
      
      if (!cliqId) {
        console.warn('[CALENDAR] No cliqId in URL');
        setIsLoading(false);
        return;
      }
      
      // Check session and fetch data
      checkSessionAndFetchActivities(cliqId, eventId);
    }
  }, []);

  const checkSessionAndFetchActivities = async (cliqId: string, eventId: string | null) => {
    try {
      setIsLoading(true);

      // First, check if user is authenticated
      const sessionResponse = await fetch('/api/auth/status', {
        credentials: 'include',
      });

      if (sessionResponse.status === 401) {
        router.push('/sign-in');
        return;
      }

      if (!sessionResponse.ok) {
        throw new Error('Failed to check session');
      }

      const sessionData = await sessionResponse.json();

      if (!sessionData.user) {
        router.push('/sign-in');
        return;
      }

      setSession(sessionData.user);
      
      // Now fetch the data
      fetchCliqName(cliqId);
      fetchActivities(cliqId, eventId);
    } catch (error) {
      console.error('[CALENDAR] Error checking session:', error);
      toast({
        title: 'Error',
        description: 'Unable to load your calendar right now. Please refresh.',
      });
      setIsLoading(false);
    }
  };

  const fetchCliqName = async (cliqId: string) => {
    try {
      const response = await fetch(`/api/cliqs/${cliqId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cliq');
      }

      const data = await response.json();
      const cliq = data.cliq || data;
      console.log('[CALENDAR] Fetched cliq name:', cliq.name);
      setSelectedCliqName(cliq.name || '');
    } catch (error) {
      console.error('[CALENDAR] Error fetching cliq name:', error);
    }
  };

  const fetchActivities = async (cliqId: string, eventId: string | null) => {
    try {
      setIsLoading(true);

      console.log('[CALENDAR] Fetching activities for cliqId:', cliqId);

      const response = await fetch(`/api/activities/list?cliqId=${cliqId}`, {
        method: 'GET',
        credentials: 'include',
      });

      console.log('[CALENDAR] Fetch response status:', response.status);

      if (response.status === 401 || response.status === 403) {
        console.error('[CALENDAR] Auth error:', response.status);
        router.push('/sign-in');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CALENDAR] Fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }

      const data = await response.json();
      console.log('[CALENDAR] Fetched activities:', data.activities?.length || 0, data.activities);
      setActivities(data.activities || []);
      
      // If eventId was provided, find it and auto-select it
      if (eventId && data.activities) {
        const targetEvent = data.activities.find((a: Activity) => a._id === eventId);
        if (targetEvent) {
          console.log('[CALENDAR] Auto-selecting event:', eventId);
          setSelectedActivity(targetEvent);
          
          // Set initial month to the month of the event
          // CRITICAL: Use Luxon to get the date in the event's timezone
          const eventTimezone = targetEvent.timezone || 'America/Los_Angeles';
          const eventDateInTz = DateTime.fromMillis(targetEvent.startAt)
            .setZone(eventTimezone);
          
          // Get the calendar date components in the event's timezone
          const year = eventDateInTz.year;
          const month = eventDateInTz.month - 1; // JavaScript months are 0-indexed
          const day = eventDateInTz.day;
          
          // Create a Date object for this calendar day
          const calendarDate = new Date(year, month, day);
          
          setInitialMonth(calendarDate);
          console.log('[CALENDAR] Setting calendar to month:', {
            eventId,
            startAtUTC: new Date(targetEvent.startAt).toISOString(),
            timezone: eventTimezone,
            eventDateInTz: eventDateInTz.toISO(),
            calendarYear: year,
            calendarMonth: month + 1,
            calendarDay: day,
            calendarDate: calendarDate.toLocaleDateString(),
          });
        } else {
          console.warn('[CALENDAR] Event not found:', eventId);
        }
      }
    } catch (error) {
      console.error('[CALENDAR] Error fetching activities:', error);
      toast({
        title: 'Warning',
        description: 'Could not load activities. The calendar will show as empty.',
      });
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateActivity = async (data: ActivityFormData) => {
    // CRITICAL VALIDATION: Ensure cliqId in form matches URL cliqId
    if (data.cliqId !== urlCliqId) {
      console.error('[CALENDAR] CliqId mismatch! Form:', data.cliqId, 'URL:', urlCliqId);
      toast({
        title: 'Error',
        description: 'CliqId mismatch detected. Please refresh and try again.',
      });
      return;
    }

    try {
      console.log('[CALENDAR] Creating activity with cliqId:', data.cliqId);

      const response = await fetch('/api/activities/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        router.push('/sign-in');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create activity');
      }

      toast({
        title: 'Success',
        description: 'Activity created successfully!',
      });

      // Small delay to allow Convex to sync
      await new Promise(resolve => setTimeout(resolve, 100));

      // Refresh activities list using URL cliqId
      if (urlCliqId) {
        await fetchActivities(urlCliqId, null);
      }
      setShowForm(false);
    } catch (error) {
      console.error('[CALENDAR] Error creating activity:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create activity',
      });
    }
  };

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleRsvp = async (activityId: string, status: string) => {
    try {
      const response = await fetch('/api/activities/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ activityId, status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to RSVP');
      }

      toast({
        title: 'Success',
        description: `RSVP updated to "${status}"`,
      });

      // Refresh activities
      if (urlCliqId) {
        await fetchActivities(urlCliqId, null);
      }
    } catch (error) {
      console.error('[CALENDAR] RSVP error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to RSVP',
      });
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch('/api/activities/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ activityId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete event');
      }

      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });

      // Refresh activities
      if (urlCliqId) {
        await fetchActivities(urlCliqId, null);
      }
      setSelectedActivity(null);
    } catch (error) {
      console.error('[CALENDAR] Delete error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete event',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 Calendar</h1>
        <p className="text-gray-600">
          {selectedCliqName ? `${selectedCliqName} • View and manage activities` : 'View and manage activities across your cliqs'}
        </p>
      </div>

      {/* Show error if no cliq selected */}
      {!urlCliqId && (
        <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">No Cliq Selected</h3>
          <p className="text-yellow-800">Click the Calendar button from within a cliq to view or create activities.</p>
        </div>
      )}

      {/* View Toggle */}
      {urlCliqId && (
        <div className="flex gap-2 mb-6">
          {['month', 'week'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as 'month' | 'week')}
              className={`px-4 py-2 rounded font-medium transition ${
                view === v
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {v === 'month' ? 'Month' : 'Week'}
            </button>
          ))}
        </div>
      )}

      {/* Calendar Grid - Always render, even with empty data */}
      {urlCliqId && (
        <div className="mb-8">
          <CalendarView
            activities={activities as any}
            view={view}
            onActivityClick={handleActivityClick as any}
            onCreateClick={() => setShowForm(true)}
            initialMonth={initialMonth}
            key={initialMonth ? initialMonth.toISOString() : 'default'}
          />
        </div>
      )}

      {/* Upcoming Activities List - Mobile Only */}
      {urlCliqId && (
        <div className="sm:hidden">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Activities</h2>
          {activities.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">No activities scheduled</p>
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Create First Activity
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activities
                .filter((a) => a.startAt > Date.now())
                .sort((a, b) => a.startAt - b.startAt)
                .slice(0, 10)
                .map((activity) => (
                  <EventCard
                    key={activity._id}
                    id={activity._id}
                    title={activity.title}
                    description={activity.description}
                    startAt={activity.startAt}
                    endAt={activity.endAt}
                    location={activity.location}
                    locationVisibility={activity.locationVisibility}
                    requiresApproval={activity.requiresParentApproval}
                    rsvps={activity.rsvps}
                    onViewDetails={() => handleActivityClick(activity)}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && urlCliqId && (
        <EventForm
          cliqId={urlCliqId}
          cliqName={selectedCliqName}
          onSubmit={handleCreateActivity}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSelectedActivity(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <EventCard
              id={selectedActivity._id}
              title={selectedActivity.title}
              description={selectedActivity.description}
              startAt={selectedActivity.startAt}
              endAt={selectedActivity.endAt}
              location={selectedActivity.location}
              locationVisibility={selectedActivity.locationVisibility}
              rsvps={selectedActivity.rsvps}
              canDelete={true} // TODO: Check actual permissions (creator, parent, or cliq owner)
              onViewDetails={() => {}}
              onDelete={() => handleDelete(selectedActivity._id)}
            />

            {/* RSVP Buttons */}
            <div className="mt-6 space-y-3 border-t pt-4">
              <p className="text-sm font-medium text-gray-700">Your RSVP:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleRsvp(selectedActivity._id, 'going')}
                  className="bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-3 rounded transition text-sm"
                >
                  I'm In
                </button>
                <button
                  onClick={() => handleRsvp(selectedActivity._id, 'maybe')}
                  className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium py-2 px-3 rounded transition text-sm"
                >
                  Maybe
                </button>
                <button
                  onClick={() => handleRsvp(selectedActivity._id, 'raincheck')}
                  className="bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-3 rounded transition text-sm"
                >
                  Raincheck
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
