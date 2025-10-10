export const dynamic = 'force-dynamic';

/**
 * 🔐 PARENT HQ: Manage Mode
 *
 * Purpose:
 *   - Clean interface for managing existing children
 *   - Child selection dropdown and management tools
 *   - No setup mode distractions
 */

import ParentDashboard from '@/components/parents/ParentDashboard';

export default function ParentsHQManagePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <ParentDashboard context="manage" />
      </div>
    </div>
  );
}
