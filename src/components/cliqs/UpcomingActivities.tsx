'use client';

import { useEffect, useState } from 'react';

interface Activity {
  _id: string;
  title: string;
  startAt: number;
  location?: string;
  locationVisibility?: string;
  requiresParentApproval?: boolean;
  rsvps?: Record<string, string>;
}

interface UpcomingActivitiesProps {
  cliqId: string;
}

export default function UpcomingActivities({ cliqId }: UpcomingActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/activities/list?cliqId=${cliqId}`, {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch activities');

        const data = await response.json();
        
        // Get next 7 days of activities, sorted by start time
        const now = Date.now();
        const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
        
        const upcomingActivities = (data.activities || [])
          .filter((a: Activity) => a.startAt >= now && a.startAt <= sevenDaysFromNow)
          .sort((a: Activity, b: Activity) => a.startAt - b.startAt)
          .slice(0, 3); // Show only next 3 activities

        setActivities(upcomingActivities);
      } catch (error) {
        console.error('[UPCOMING_ACTIVITIES] Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [cliqId]);

  if (loading || activities.length === 0) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (isTomorrow) return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-black mb-4">📅 Upcoming Events</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity._id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-300 transition">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-black truncate">{activity.title}</p>
                {activity.requiresParentApproval && (
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded whitespace-nowrap">
                    Pending
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{formatDate(activity.startAt)}</p>
              {activity.location && (
                <p className="text-sm text-gray-500 truncate">📍 {activity.location}</p>
              )}
              {activity.rsvps && Object.keys(activity.rsvps).length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {Object.keys(activity.rsvps).length} {Object.keys(activity.rsvps).length === 1 ? 'person' : 'people'} going
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
