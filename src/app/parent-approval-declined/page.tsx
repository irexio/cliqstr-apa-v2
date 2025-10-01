'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ParentApprovalDeclinedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation Declined</h1>
        
        <p className="text-gray-600 mb-6">
          You have successfully declined the child invitation. The child will not be able to join Cliqstr with this invitation.
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/parents/hq')}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            Go to Parents HQ
          </Button>
          
          <Button 
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Go to Home Page
          </Button>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> If you change your mind, you can always approve future invitations from the Parents HQ dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
