'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  username: string;
  accountStatus: 'active' | 'pending' | 'suspended';
  permissions: {
    silentMonitoring: boolean;
    canReceiveInvites: boolean;
    receiveInvitesRequireApproval: boolean;
    canSendInvitesToChildren: boolean;
    sendInvitesToChildrenRequireApproval: boolean;
    canSendInvitesToAdults: boolean;
    sendInvitesToAdultsRequireApproval: boolean;
  };
}

interface ParentsDashboardProps {
  approvalToken?: string;
}

export default function ParentsDashboard({ approvalToken }: ParentsDashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await fetch('/api/parent/children', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load children');
        }

        setChildren(data.children || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load children');
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        <p className="ml-3 text-gray-600">Loading your children...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800 font-medium">Error Loading Dashboard</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">⚡ Parents HQ</h1>
        <p className="text-gray-600 mt-1">Manage permissions for your children</p>
      </div>

      {/* Children List */}
      {children.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">You haven't added any children yet.</p>
            <Button onClick={() => {
              if (approvalToken) {
                router.push(`/parents/hq/child/new?approvalToken=${encodeURIComponent(approvalToken)}`);
              } else {
                router.push('/parents/hq/child/new');
              }
            }}>
              + Add Your First Child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child) => (
            <Card key={child.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {child.firstName} {child.lastName}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {child.age} years old • @{child.username}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    child.accountStatus === 'active' ? 'bg-green-100 text-green-800' :
                    child.accountStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {child.accountStatus}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Permission Summary */}
                <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Silent Monitoring:</span>
                    <span className="font-semibold">{child.permissions.silentMonitoring ? '✓ On' : '○ Off'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Can receive invites:</span>
                    <span className="font-semibold">{child.permissions.canReceiveInvites ? '✓ Yes' : '○ No'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Invites require approval:</span>
                    <span className="font-semibold">{child.permissions.receiveInvitesRequireApproval ? '✓ Yes' : '○ Auto-join'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/parents/hq/child/${child.id}`} className="flex-1">
                    <Button variant="outline" className="w-full text-sm">
                      Edit Permissions
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/parents/hq/child/${child.id}/activity`)}
                    className="flex-1 text-sm"
                  >
                    View Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Another Child Button */}
      {children.length > 0 && (
        <div className="text-center pt-4">
          <Button onClick={() => {
            if (approvalToken) {
              router.push(`/parents/hq/child/new?approvalToken=${encodeURIComponent(approvalToken)}`);
            } else {
              router.push('/parents/hq/child/new');
            }
          }} size="lg">
            + Add Another Child
          </Button>
        </div>
      )}
    </div>
  );
}
