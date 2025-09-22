import { Suspense } from 'react';
import ParentApprovalContent from './_client';

export default function ParentApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-300 w-full max-w-md mx-auto space-y-4">
        <Suspense fallback={<div>Loading approval request...</div>}>
          <ParentApprovalContent />
        </Suspense>
      </div>
    </div>
  );
}
