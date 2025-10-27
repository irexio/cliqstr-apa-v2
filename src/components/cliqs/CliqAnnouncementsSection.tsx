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
  console.log('[COMPONENT] CliqAnnouncementsSection MOUNTED - cliqId:', cliqId);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">📣 Updates & Events</h3>
      <p className="text-gray-600">Component is rendering - waiting for API data...</p>
    </div>
  );
}
