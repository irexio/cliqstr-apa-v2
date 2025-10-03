'use client';

import { useRouter } from 'next/navigation';

export default function CreateNewChildSection() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">➕ Add New Child</h2>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Create a new child account and set up their permissions and safety controls.
      </p>

      <div className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          <p>To add a new child, use the proper invite flow:</p>
        </div>
        <button
          onClick={() => router.push('/cliqs/build')}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Create Cliq → Invite Child
        </button>
        <div className="text-xs text-gray-500">
          <p>This will take you through the proper child invitation process with all required information.</p>
        </div>
      </div>
    </div>
  );
}
