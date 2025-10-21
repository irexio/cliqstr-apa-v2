"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childName = searchParams.get('childName') || 'Your child';
  const isUpdate = searchParams.get('isUpdate') === 'true';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {isUpdate ? (
        /* Permission Update Success */
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center p-6">
            <div className="text-5xl mb-4">✅</div>
            <CardTitle className="text-2xl text-green-900">
              Permissions Updated
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-green-800 text-lg">
              Permissions for <strong>{childName}</strong> have been successfully updated.
            </p>
            <p className="text-green-700">
              Your changes will take effect immediately.
            </p>
            <div className="pt-4">
              <Button onClick={() => router.push('/parents/hq')} size="lg">
                Back to Parents HQ
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* New Child Setup Success */
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center p-6">
              <div className="text-5xl mb-4">🎉</div>
              <CardTitle className="text-2xl text-green-900">
                Account Created Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-green-800 text-lg">
                Congratulations! <strong>{childName}</strong> is now ready to join Cliqstr.
              </p>
              <p className="text-green-700">
                All safety features and permissions have been configured.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="p-6">
              <CardTitle className="text-lg text-blue-900">What to do next</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-blue-800">
              <div>
                <p className="font-semibold mb-1">Silent Monitoring:</p>
                <p>You can monitor {childName}'s activity through your Parent HQ dashboard without them knowing.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Red Alerts:</p>
                <p>If any concerning behavior is detected, you'll receive instant alerts to keep {childName} safe.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Partnership:</p>
                <p>Open communication with {childName} about Cliqstr's values and their new safe online space.</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              onClick={() => router.push('/my-cliqs-dashboard')}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Go to My Cliqs Dashboard
            </Button>
            <Button
              onClick={() => router.push('/parents/hq/child/new')}
              size="lg"
              className="flex-1"
            >
              + Add Another Child
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}