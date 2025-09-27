'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';

interface ActivityLog {
  type: 'user_activity' | 'parent_audit';
  id: string;
  event: string;
  detail: string;
  createdAt: number;
  debugId?: string;
  oldValue?: string;
  newValue?: string;
}

interface ChildActivityLogsProps {
  childId: string;
  childName: string;
}

export default function ChildActivityLogs({ childId, childName }: ChildActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/parent/activity-logs?childId=${encodeURIComponent(childId)}&limit=${limit}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch activity logs');
      }
      
      setLogs(data.logs || []);
    } catch (err: any) {
      console.error('[CHILD_ACTIVITY_LOGS] Error fetching logs:', err);
      setError(err.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [childId, limit]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'login':
        return '🔐';
      case 'logout':
        return '🚪';
      case 'post_created':
        return '📝';
      case 'reply_created':
        return '💬';
      case 'cliq_joined':
        return '👥';
      case 'cliq_left':
        return '👋';
      case 'invite_sent':
        return '📤';
      case 'profile_update':
        return '👤';
      case 'email_verify':
        return '✅';
      case 'updated_child_settings':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const getEventColor = (type: string, event: string) => {
    if (type === 'parent_audit') {
      return 'bg-blue-50 border-blue-200 text-blue-900';
    }
    
    switch (event) {
      case 'login':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'logout':
        return 'bg-gray-50 border-gray-200 text-gray-900';
      case 'post_created':
      case 'reply_created':
        return 'bg-purple-50 border-purple-200 text-purple-900';
      case 'cliq_joined':
        return 'bg-indigo-50 border-indigo-200 text-indigo-900';
      case 'cliq_left':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'invite_sent':
        return 'bg-pink-50 border-pink-200 text-pink-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Logs for {childName}</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Loading activity logs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Logs for {childName}</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">Error: {error}</p>
          <Button 
            onClick={fetchLogs}
            className="mt-3 bg-red-600 text-white hover:bg-red-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Activity Logs for {childName}</h3>
        <div className="flex items-center space-x-2">
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value={25}>Last 25</option>
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
          </select>
          <Button 
            onClick={fetchLogs}
            className="text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Refresh
          </Button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No activity logs found for {childName}.</p>
          <p className="text-sm mt-1">Activity will appear here as {childName} uses the app.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`border rounded-lg p-3 ${getEventColor(log.type, log.event)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <span className="text-lg">{getEventIcon(log.event)}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {log.event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      {log.type === 'parent_audit' && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Parent Action
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1 opacity-90">{log.detail}</p>
                    {log.debugId && (
                      <p className="text-xs mt-1 opacity-75">Debug ID: {log.debugId}</p>
                    )}
                    {log.oldValue && log.newValue && (
                      <div className="mt-2 text-xs">
                        <details className="cursor-pointer">
                          <summary className="font-medium">View Changes</summary>
                          <div className="mt-2 space-y-1">
                            <div>
                              <span className="font-medium text-red-600">Before:</span>
                              <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(JSON.parse(log.oldValue), null, 2)}
                              </pre>
                            </div>
                            <div>
                              <span className="font-medium text-green-600">After:</span>
                              <pre className="text-xs bg-green-50 p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(JSON.parse(log.newValue), null, 2)}
                              </pre>
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs opacity-75 ml-4">
                  {formatTimestamp(log.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Activity logs are automatically generated when {childName} uses the app.</p>
        <p>Parent actions (like changing settings) are also logged here.</p>
      </div>
    </div>
  );
}
