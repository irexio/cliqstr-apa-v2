'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ParentsHQHelpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">⚡ Parents HQ Help</h1>
          <p className="text-gray-600 mt-2">Troubleshooting and support for parent approval issues</p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          
          {/* Common Issues */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Common Issues & Solutions</h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">"Invalid or Expired Approval Request"</h3>
                <p className="text-gray-600 mt-1">
                  This usually means the approval link has expired (36 hours) or has already been used.
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Solution:</strong> Have your child request approval again from the signup page.
                </div>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-medium text-gray-900">"Approval Already Completed"</h3>
                <p className="text-gray-600 mt-1">
                  This means you've already approved this child's account.
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Solution:</strong> Go to Parents HQ to manage your child's account and settings.
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Can't find the approval email</h3>
                <p className="text-gray-600 mt-1">
                  Check your spam folder or ask your child to resend the approval request.
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Solution:</strong> Have your child enter your email again on the signup page.
                </div>
              </div>
            </div>
          </div>

          {/* How to Resend Approval */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Request New Approval</h2>
            <div className="space-y-3 text-gray-600">
              <p>If you need a new approval request:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Have your child go to the Cliqstr signup page</li>
                <li>Enter their birthdate and personal information</li>
                <li>When prompted, enter your email address</li>
                <li>Check your email for the new approval link</li>
                <li>Click the approval button in the email</li>
              </ol>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Still Need Help?</h2>
            <div className="space-y-3 text-gray-600">
              <p>If you're still experiencing issues, please contact our support team:</p>
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="font-medium text-blue-900">Email Support</p>
                <p className="text-blue-800">inquiry@cliqstr.com</p>
                <p className="text-sm text-blue-700 mt-1">
                  Include your email address and a description of the issue for faster assistance.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/parents/hq"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Parents HQ
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Child Signup Page
              </Link>
              <Link
                href="/"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Home Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
