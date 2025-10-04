'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * AdultUpgradeSection - Shows upgrade option for Adult users who need Parent role
 * This component appears when an Adult user visits Parents HQ but needs to be upgraded
 */
export default function AdultUpgradeSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/wizard/upgrade-to-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade to Parent role');
      }

      setSuccess(true);
      // Force page refresh to update user role in session
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err: any) {
      console.error('[AdultUpgradeSection] Upgrade failed:', err);
      setError(err.message || 'Failed to upgrade to Parent role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">Successfully Upgraded!</h3>
          <p className="text-green-700">Your account has been upgraded to Parent role. Refreshing page...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-yellow-900">
          🔧 Complete Your Parent Setup
        </CardTitle>
        <CardDescription className="text-yellow-700">
          You're accessing Parents HQ, but your account needs to be upgraded to Parent role to access all features.
          This is a one-time setup that enables full child management capabilities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        <div className="space-y-3">
          <p className="text-sm text-yellow-800">
            <strong>What this upgrade enables:</strong>
          </p>
          <ul className="text-sm text-yellow-800 space-y-1 ml-4">
            <li>• Full access to Parents HQ dashboard</li>
            <li>• Create and manage child accounts</li>
            <li>• Set child permissions and safety controls</li>
            <li>• Monitor child activity and cliqs</li>
            <li>• Respond to Red Alerts and safety notifications</li>
          </ul>
        </div>

        <Button 
          onClick={handleUpgrade} 
          disabled={loading}
          className="w-full mt-4 bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50"
        >
          {loading ? 'Upgrading...' : 'Upgrade to Parent Account'}
        </Button>
      </CardContent>
    </Card>
  );
}
