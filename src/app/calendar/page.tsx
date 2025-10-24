'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CalendarView from '@/components/calendar/CalendarView';
import EventCard from '@/components/calendar/EventCard';
import EventForm, { ActivityFormData } from '@/components/calendar/EventForm';
import { useToast } from '@/components/ui/use-toast';

interface Activity {
  _id: string;
  title: string;
  description?: string;
  startAt: number;
  endAt: number;
  location?: string;
  locationVisibility?: 'everyone' | 'parents' | 'hidden';
  requiresParentApproval?: boolean;
  rsvps?: Record<string, string>;
  createdByUserId?: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Fetch activities on mount
  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/activities/list?userId=current', {
        credentials: 'include',
      });

      if (response.status === 401) {
        router.push('/sign-in');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch activities');

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load activities',
        variant: 'destructive',
      });
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

      if (!response.ok) throw new Error('Failed to create activity');

      toast({
        title: 'Success',
        description: 'Activity created successfully!',
      });

      await fetchActivities();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create activity',
        variant: 'destructive',
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

      {/* Calendar */}
      <div className="mb-8">
        <CalendarView
          activities={activities}
          view={view}
          onActivityClick={handleActivityClick}
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
      {showForm && (
        <EventForm
          onSubmit={handleCreateActivity}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedActivity(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
