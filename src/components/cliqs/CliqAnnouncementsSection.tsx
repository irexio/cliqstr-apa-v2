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
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('[COMPONENT] CliqAnnouncementsSection MOUNTED - cliqId:', cliqId);

  useEffect(() => {
    console.log('[EFFECT] Starting fetch - cliqId:', cliqId);
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch upcoming activities
        let activities: Activity[] = [];
        try {
          const now = Date.now();
          const rangeEnd = now + DAYS_AHEAD * 24 * 60 * 60 * 1000;

          const activitiesRes = await fetch(
            `/api/activities/list?cliqId=${cliqId}`,
            { credentials: 'include' }
          );

          const activitiesData = await activitiesRes.json();
          console.log('[DEBUG] API Response:', activitiesData);

          if (activitiesRes.ok) {
            console.log('[DEBUG] Raw activities from API:', activitiesData.activities?.length || 0);
            
            activities = (activitiesData.activities || [])
              .filter((a: Activity) => {
                const isInRange = a.startAt >= now && a.startAt <= rangeEnd;
                return isInRange;
              })
              .sort((a: Activity, b: Activity) => a.startAt - b.startAt);
            
            console.log('[DEBUG] Activities after filter:', activities.length);
          }
        } catch (err) {
          console.error('[ERROR] Failed to fetch activities:', err);
        }

        // Map activities to AnnouncementItem format
        const announcementItems: AnnouncementItem[] = activities.map((a) => ({
          id: a._id,
          type: 'activity' as const,
          title: a.title,
          content: `📅 ${new Date(a.startAt).toLocaleDateString()}${
            a.location ? ` • ${a.location}` : ''
          }`,
          timestamp: a.startAt,
          metadata: a,
        }));

        setItems(announcementItems);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cliqId]);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">📣 Updates & Events</h3>
      
      <div className="border rounded-lg bg-white h-48 flex items-center justify-center">
        {loading ? (
          <p className="text-gray-600">Loading events…</p>
        ) : (
          <div className="text-center">
            <p className="text-gray-700 font-medium">{items.length} events found</p>
            {items.length > 0 && (
              <ul className="mt-3 text-sm text-gray-600">
                {items.slice(0, 3).map((item) => (
                  <li key={item.id}>{item.title}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
