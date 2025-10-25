'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();

  // CRITICAL: cliqId MUST come from URL, read it immediately
  const [urlCliqId, setUrlCliqId] = useState<string | null>(null);
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedCliqName, setSelectedCliqName] = useState<string>('');
  const [view, setView] = useState<'month' | 'week'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [session, setSession] = useState<any>(null);

  // Check session on mount
  useEffect(() => {
    checkSessionAndFetchActivities();
  }, []);

  // Read cliqId from URL params immediately - with fallback
  useEffect(() => {
    // First try searchParams (should work in most cases)
    let cliqId = searchParams.get('cliqId');
    console.log('[CALENDAR] searchParams.get cliqId:', cliqId);
    
    // Fallback: read directly from window.location if on client
    if (!cliqId && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      cliqId = params.get('cliqId');
      console.log('[CALENDAR] Fallback from window.location cliqId:', cliqId);
    }
    
    console.log('[CALENDAR] Final cliqId to use:', cliqId);
    console.log('[CALENDAR] Full URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
    
    setUrlCliqId(cliqId);
  }, [searchParams]);

  // Fetch activities and cliq name whenever URL cliqId changes
  useEffect(() => {
    if (urlCliqId) {
      console.log('[CALENDAR] URL cliqId changed to:', urlCliqId);
      fetchCliqName(urlCliqId);
      fetchActivities(urlCliqId);
    } else {
      console.warn('[CALENDAR] No cliqId in URL params');
      setActivities([]);
      setIsLoading(false);
    }
  }, [urlCliqId]);

  const checkSessionAndFetchActivities = async () => {
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

  const fetchActivities = async (cliqId: string) => {
    try {
      setIsLoading(true);

      console.log('[CALENDAR] Fetching activities for cliqId:', cliqId);

      const response = await fetch(`/api/activities/list?cliqId=${cliqId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/sign-in');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }

      const data = await response.json();
      console.log('[CALENDAR] Fetched activities:', data.activities?.length || 0, data.activities);
      setActivities(data.activities || []);
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
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh activities list using URL cliqId
      if (urlCliqId) {
        await fetchActivities(urlCliqId);
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
              onViewDetails={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}
