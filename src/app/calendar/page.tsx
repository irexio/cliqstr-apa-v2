'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

  const [activities, setActivities] = useState<Activity[]>([]);
  const [cliqs, setCliqs] = useState<Cliq[]>([]);
  const [selectedCliqId, setSelectedCliqId] = useState<string>('');
  const [view, setView] = useState<'month' | 'week'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [session, setSession] = useState<any>(null);

  // Check session and fetch activities on mount
  useEffect(() => {
    checkSessionAndFetchActivities();
  }, []);

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

      // Fetch cliqs
      await fetchCliqs();

      // Now fetch activities
      await fetchActivities();
    } catch (error) {
      console.error('[CALENDAR] Error checking session:', error);
      toast({
        title: 'Error',
        description: 'Unable to load your calendar right now. Please refresh.',
      });
      setIsLoading(false);
    }
  };

  const fetchCliqs = async () => {
    try {
      const response = await fetch('/api/cliqs', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cliqs');
      }

      const data = await response.json();
      const cliqList = data.cliqs || [];
      setCliqs(cliqList);

      // Auto-select first cliq if only one exists
      if (cliqList.length === 1) {
        setSelectedCliqId(cliqList[0]._id);
      } else if (cliqList.length > 0) {
        setSelectedCliqId(cliqList[0]._id);
      }
    } catch (error) {
      console.error('[CALENDAR] Error fetching cliqs:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/activities/list', {
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
      setActivities(data.activities || []);
    } catch (error) {
      console.error('[CALENDAR] Error fetching activities:', error);
      // Show error but don't block calendar rendering
      toast({
        title: 'Warning',
        description: 'Could not load activities. The calendar will show as empty.',
      });
      setActivities([]); // Set empty array so calendar can still render
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateActivity = async (data: ActivityFormData) => {
    try {
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

      // Refresh activities list
      await fetchActivities();
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
        <p className="text-gray-600">View and manage activities across your cliqs</p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        {['month', 'week'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v as 'month' | 'week')}
            className={`px-4 py-2 rounded font-medium transition ${
              view === v
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {v === 'month' ? 'Month' : 'Week'}
          </button>
        ))}
      </div>

      {/* Calendar Grid - Always render, even with empty data */}
      <div className="mb-8">
        <CalendarView
          activities={activities as any}
          view={view}
          onActivityClick={handleActivityClick as any}
          onCreateClick={() => setShowForm(true)}
        />
      </div>

      {/* Upcoming Activities List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Activities</h2>
        {activities.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No activities scheduled</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
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

      {/* Create Form Modal */}
      {showForm && selectedCliqId && (
        <EventForm
          cliqId={selectedCliqId}
          cliqName={cliqs.find(c => c._id === selectedCliqId)?.name}
          onSubmit={handleCreateActivity}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Show warning if no cliq selected */}
      {showForm && !selectedCliqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">No Cliq Selected</h3>
            <p className="text-gray-600 mb-6">You need to be a member of at least one cliq to create an activity.</p>
            <button
              onClick={() => setShowForm(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
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
