'use client';

import React from 'react';
import { MapPin, Clock, Users, AlertCircle } from 'lucide-react';

interface EventCardProps {
  id: string;
  title: string;
  description?: string;
  startAt: number;
  endAt: number;
  location?: string;
  locationVisibility?: string;
  requiresApproval?: boolean;
  rsvps?: Record<string, string>;
  createdByName?: string;
  isChild?: boolean;
  onViewDetails?: () => void;
  onApprove?: () => void;
  onDelete?: () => void;
  isParent?: boolean;
}

export default function EventCard({
  id,
  title,
  description,
  startAt,
  endAt,
  location,
  locationVisibility,
  requiresApproval,
  rsvps = {},
  createdByName,
  isChild,
  onViewDetails,
  onApprove,
  onDelete,
  isParent,
}: EventCardProps) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  const rsvpCounts = {
    going: Object.values(rsvps).filter((s) => s === 'going').length,
    maybe: Object.values(rsvps).filter((s) => s === 'maybe').length,
    raincheck: Object.values(rsvps).filter((s) => s === 'raincheck').length,
  };

  const displayLocation =
    locationVisibility === 'hidden'
      ? undefined
      : locationVisibility === 'parents' && !isParent && !isChild
      ? '📍 Location visible to parents'
      : location;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition p-4">
      {/* Header with Title and Badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
          {createdByName && (
            <p className="text-sm text-gray-500">by {createdByName}</p>
          )}
        </div>

        {requiresApproval && isParent && (
          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Pending
          </div>
        )}

        {requiresApproval && !isParent && (
          <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Awaiting
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
      )}

      {/* Time */}
      <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
        <Clock className="w-4 h-4 text-gray-500" />
        <span>
          {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Location */}
      {displayLocation && (
        <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span>{displayLocation}</span>
        </div>
      )}

      {/* RSVP Counts */}
      {Object.keys(rsvps).length > 0 && (
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 py-2 bg-gray-50 px-3 rounded">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span className="font-medium">{rsvpCounts.going}</span>
            <span>Going</span>
          </div>
          {rsvpCounts.maybe > 0 && (
            <div>
              <span className="font-medium">{rsvpCounts.maybe}</span>
              <span> Maybe</span>
            </div>
          )}
          {rsvpCounts.raincheck > 0 && (
            <div>
              <span className="font-medium">{rsvpCounts.raincheck}</span>
              <span> Raincheck</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <button
          onClick={onViewDetails}
          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-3 rounded transition text-sm"
        >
          View Details
        </button>

        {requiresApproval && isParent && (
          <>
            <button
              onClick={onApprove}
              className="bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-4 rounded transition text-sm"
            >
              Approve
            </button>
            <button
              onClick={onDelete}
              className="bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded transition text-sm"
            >
              Decline
            </button>
          </>
        )}
      </div>
    </div>
  );
}
