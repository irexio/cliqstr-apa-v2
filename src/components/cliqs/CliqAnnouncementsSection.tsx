'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AnnouncementsCarousel from './AnnouncementsCarousel';
import { useAuth } from '@/lib/auth/useAuth';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface Notice {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  expiresAt?: string | null;
}

interface Activity {
  _id: string;
  title: string;
  startAt: number;
  location?: string;
  locationVisibility?: string;
  requiresParentApproval?: boolean;
  rsvps?: Record<string, string>;
  createdByUserId?: string;
}

interface AnnouncementItem {
  id: string;
  type: 'notice' | 'activity';
  title: string;
  content: string;
  timestamp: number;
  metadata?: any;
}

interface CarouselItem {
  id: string;
  title: string;
  content: string;
  startAt?: number;
  location?: string;
  rsvps?: Record<string, string>;
  createdByUserId?: string;
  canDelete?: boolean;
}

interface CliqAnnouncementsSectionProps {
  cliqId: string;
  cliqOwnerId?: string;
}

// Configurable: Show events up to N days in the future
const DAYS_AHEAD = 30;

export default function CliqAnnouncementsSection({ cliqId, cliqOwnerId }: CliqAnnouncementsSectionProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedNotices, setDismissedNotices] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch notices
        let notices: Notice[] = [];
        try {
          const noticesRes = await fetch(`/api/cliqs/${cliqId}/notices`, {
            credentials: 'include',
          });
          if (noticesRes.ok) {
            const noticesData = await noticesRes.json();
            notices = noticesData.notices || [];
            console.log('[ANNOUNCEMENTS] Retrieved notices:', notices.length);
          }
        } catch (err) {
          console.error('[ANNOUNCEMENTS] Failed to fetch notices:', err);
        }

        // Fetch upcoming activities
        let activities: Activity[] = [];
        try {
          const now = Date.now();
          const rangeEnd = now + DAYS_AHEAD * 24 * 60 * 60 * 1000;

          const activitiesRes = await fetch(
            `/api/activities/list?cliqId=${cliqId}`,
            { credentials: 'include' }
          );

          if (activitiesRes.ok) {
            const activitiesData = await activitiesRes.json();
            console.log('[ANNOUNCEMENTS] Raw activities from API:', activitiesData.activities?.length || 0, activitiesData.activities);
            console.log('[ANNOUNCEMENTS] Date range - Now:', new Date(now).toISOString(), 'End:', new Date(rangeEnd).toISOString());
            
            activities = (activitiesData.activities || [])
              .filter((a: Activity) => {
                const isInRange = a.startAt >= now && a.startAt <= rangeEnd;
                if (!isInRange) {
                  console.log(`[ANNOUNCEMENTS] Activity "${a.title}" excluded - startAt: ${new Date(a.startAt).toISOString()}`);
                }
                return isInRange;
              })
              .sort((a: Activity, b: Activity) => a.startAt - b.startAt)
              .slice(0, 10); // Show more for testing
            
            console.log('[ANNOUNCEMENTS] Retrieved activities after filter:', activities.length, activities);
          }
        } catch (err) {
          console.error('[ANNOUNCEMENTS] Failed to fetch activities:', err);
        }

        // Combine and sort
        const combinedItems: AnnouncementItem[] = [];

        // Add notices
        notices.forEach((notice) => {
          combinedItems.push({
            id: notice.id,
            type: 'notice',
            title: notice.type === 'admin' ? '📢 Announcement' : '🎉 Birthday',
            content: notice.content,
            timestamp: new Date(notice.createdAt).getTime(),
            metadata: notice,
          });
        });

        // Add activities
        activities.forEach((activity) => {
          combinedItems.push({
            id: activity._id,
            type: 'activity',
            title: activity.title,
            content: `📅 ${new Date(activity.startAt).toLocaleDateString()}${
              activity.location ? ` • ${activity.location}` : ''
            }`,
            timestamp: activity.startAt,
            metadata: activity,
          });
        });

        // Sort by timestamp (newest first for notices, oldest first for activities)
        combinedItems.sort((a, b) => {
          if (a.type === 'notice' && b.type === 'activity') return -1;
          if (a.type === 'activity' && b.type === 'notice') return 1;
          if (a.type === 'notice') return b.timestamp - a.timestamp; // Notices: newest first
          return a.timestamp - b.timestamp; // Activities: oldest first
        });

        console.log('[ANNOUNCEMENTS] Final combined items:', combinedItems.length, combinedItems);
        setItems(combinedItems);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cliqId]);

  const dismissNotice = (id: string) => {
    setDismissedNotices((prev) => new Set([...prev, id]));
  };

  const visibleItems = items.filter(
    (item) => !(item.type === 'notice' && dismissedNotices.has(item.id))
  );

  // Prepare carousel items (activities only)
  const carouselItems: CarouselItem[] = visibleItems
    .filter((item) => item.type === 'activity')
    .map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      startAt: item.metadata?.startAt,
      location: item.metadata?.location,
      rsvps: item.metadata?.rsvps,
      createdByUserId: item.metadata?.createdByUserId,
      canDelete: user?.id ? (user.id === item.metadata?.createdByUserId || user.id === cliqOwnerId) : false,
    }));

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 h-24 rounded-lg mb-6"></div>
    );
  }

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">📣 Updates & Events</h3>

      {/* Mobile: Show Carousel */}
      {carouselItems.length > 0 && (
        <div className="md:hidden mb-4">
          <AnnouncementsCarousel 
            items={carouselItems} 
            cliqOwnerId={cliqOwnerId}
            currentUserId={user?.id}
          />
          <div className="text-center mt-3">
            <Link href={`/calendar?cliqId=${cliqId}`} className="text-sm font-medium text-black underline">
              View full calendar →
            </Link>
          </div>
        </div>
      )}

      {/* Desktop/Tablet: Show Stacked List */}
      <div className="hidden md:block bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                item.type === 'notice'
                  ? 'bg-blue-50 border-blue-100 hover:border-blue-200'
                  : 'bg-white border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-black truncate">{item.title}</p>
                  {item.type === 'activity' && item.metadata?.requiresParentApproval && (
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded whitespace-nowrap">
                      Pending
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mt-1">{item.content}</p>

                {item.type === 'activity' && item.metadata?.rsvps && Object.keys(item.metadata.rsvps).length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {Object.keys(item.metadata.rsvps).length}{' '}
                    {Object.keys(item.metadata.rsvps).length === 1 ? 'person' : 'people'} going
                  </p>
                )}
              </div>

              {item.type === 'notice' && (
                <button
                  onClick={() => dismissNotice(item.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-white/50 flex-shrink-0"
                  title="Dismiss"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}

              {item.type === 'activity' && (
                <Link
                  href={`/calendar?cliqId=${cliqId}#activity-${item.id}`}
                  className="text-xs font-medium text-black hover:text-gray-700 underline whitespace-nowrap flex-shrink-0"
                >
                  View
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <Link
            href={`/calendar?cliqId=${cliqId}`}
            className="text-sm font-medium text-black hover:text-gray-700 underline"
          >
            View full calendar →
          </Link>
        </div>
      </div>
    </div>
  );
}
