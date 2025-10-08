'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ParentHQSuccess() {
  const router = useRouter();
  const [childName, setChildName] = useState<string>('');

  useEffect(() => {
    // Get child name from URL params or session storage
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('childName') || 'your child';
    setChildName(name);
  }, []);

  const handleGoToDashboard = () => {
    router.push('/parents/hq');
  };

  const handleAddAnotherChild = () => {
    router.push('/parents/hq?create=true');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Success Icon */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Success!
          </h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {childName}'s Account Created
          </h2>
          <p className="text-gray-600 mb-6">
            Your child's Cliqstr account has been successfully created with all the safety settings and permissions you configured.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleGoToDashboard}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            ⚡ Go to Parents HQ Dashboard
          </button>
          
          <button
            onClick={handleAddAnotherChild}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            + Add Another Child
          </button>
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            What's Next?
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Monitor your child's activity in real-time</li>
            <li>• Adjust permissions as needed</li>
            <li>• Set up additional safety controls</li>
            <li>• Add more children to your family account</li>
          </ul>
        </div>
      </div>
    </div>
  );
}