'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Activity {
  _id: string;
  title: string;
  startAt: number;
  endAt: number;
  location?: string;
  locationVisibility?: string;
  requiresParentApproval?: boolean;
  rsvps?: Record<string, string>;
  createdByUserId?: string;
}

interface CalendarViewProps {
  activities: Activity[];
  view: 'month' | 'week';
  onDateSelect?: (date: Date) => void;
  onActivityClick?: (activity: Activity) => void;
  onCreateClick?: () => void;
}

export default function CalendarView({
  activities,
  view,
  onDateSelect,
  onActivityClick,
  onCreateClick,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return d;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getActivitiesForDate = (date: Date) => {
    const dateStart = new Date(date).setHours(0, 0, 0, 0);
    const dateEnd = new Date(date).setHours(23, 59, 59, 999);

    return activities.filter(
      (a) => a.startAt >= dateStart && a.startAt <= dateEnd
    );
  };

  const monthDays = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays = Array(firstDay)
    .fill(null)
    .concat(Array.from({ length: monthDays }, (_, i) => i + 1));

  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {view === 'month' ? 'Month View' : 'Week View'}
          </p>
        </div>

        <button
          onClick={onCreateClick}
          className="w-full sm:w-auto bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base"
        >
          + Create Activity
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mb-6 gap-2">
        <button
          onClick={view === 'month' ? prevMonth : prevWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="text-xs sm:text-sm text-gray-600 text-center flex-1">
          {view === 'week' && (
            <span>
              {formatDate(weekStart)} - {formatDate(weekDays[6])}
            </span>
          )}
        </div>

        <button
          onClick={view === 'month' ? nextMonth : nextWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Calendar Grid - Tablet and Desktop (md and up - 768px) */}
      {view === 'month' ? (
        <div className="md:block">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-gray-700 py-2 text-xs sm:text-sm"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="bg-gray-50 rounded p-2" />;
              }

              const date = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day
              );
              const dayActivities = getActivitiesForDate(date);
              const isToday =
                date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={day}
                  onClick={() => onDateSelect?.(date)}
                  className={`min-h-24 p-2 rounded border-2 cursor-pointer transition ${
                    isToday
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`font-semibold mb-1 text-sm ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {day}
                  </div>

                  <div className="space-y-1">
                    {dayActivities.slice(0, 2).map((activity) => (
                      <div
                        key={activity._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onActivityClick?.(activity as any);
                        }}
                        className="text-xs bg-black text-white px-2 py-1 rounded truncate cursor-pointer hover:bg-gray-800 transition"
                        title={activity.title}
                      >
                        {activity.title}
                      </div>
                    ))}

                    {dayActivities.length > 2 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{dayActivities.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week View - Tablet and Desktop (md and up - 768px) */
        <div className="md:block space-y-2">
          {weekDays.map((date) => {
            const dayActivities = getActivitiesForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={date.toDateString()}
                className={`p-4 rounded-lg border-2 ${
                  isToday ? 'border-black bg-gray-50' : 'border-gray-200'
                }`}
              >
                <div
                  className={`font-semibold mb-3 text-sm ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {formatDate(date)}
                </div>

                <div className="space-y-2">
                  {dayActivities.length > 0 ? (
                    dayActivities.map((activity) => (
                      <div
                        key={activity._id}
                        onClick={() => onActivityClick?.(activity as any)}
                        className="bg-black text-white px-3 py-2 rounded cursor-pointer hover:bg-gray-800 transition text-sm"
                      >
                        <div className="font-medium truncate">{activity.title}</div>
                        <div className="text-xs text-blue-700">
                          {new Date(activity.startAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm">No events</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile list is handled by the page component, not here */}
    </div>
  );
}
