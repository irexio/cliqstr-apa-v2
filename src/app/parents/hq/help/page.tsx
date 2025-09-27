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

          {/* Red Alert System */}
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-4">🚨 Red Alert System</h2>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">What is the Red Alert System?</h3>
                <p className="text-red-800 text-sm mb-3">
                  The Red Alert system is a critical safety feature that allows any member of a cliq to immediately report concerning or inappropriate content.
                </p>
                <p className="text-red-800 text-sm">
                  When a Red Alert is triggered, the post is immediately suspended, AI moderation is activated, and all parents are instantly notified.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">How Red Alerts Work:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 ml-4">
                  <li>A child or adult clicks the red alert button (🚨) on any post in their cliq</li>
                  <li>A confirmation dialog appears asking "Was this accidental or real?"</li>
                  <li>If "real" is selected, the post is immediately suspended</li>
                  <li>AI moderation analyzes the content</li>
                  <li>All parents in the cliq receive instant notifications via email and SMS</li>
                  <li>Cliqstr's moderation team is also notified for review</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">What Parents Should Do When They Receive a Red Alert:</h3>
                <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
                  <li><strong>Check in with your child immediately</strong> - Discuss the situation and understand what happened</li>
                  <li><strong>Review the suspended content</strong> - Log into Parents HQ to see what was reported</li>
                  <li><strong>Assess the situation</strong> - Determine if this was a misunderstanding or a real concern</li>
                  <li><strong>Take appropriate action</strong> - This may include discussing online safety with your child</li>
                  <li><strong>Report problem users</strong> - If there's a concerning pattern, notify Cliqstr support</li>
                  <li><strong>Contact other parents</strong> - If multiple children are involved, coordinate with other parents</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Reporting to Cliqstr Support</h3>
                <p className="text-blue-800 text-sm mb-2">
                  If you identify a problem user or pattern of concerning behavior, please report it to:
                </p>
                <p className="font-medium text-blue-900">redalert@cliqstr.com</p>
                <p className="text-blue-800 text-sm mt-2">
                  Include details about the incident, usernames involved, and any screenshots if appropriate.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Important Notes:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                  <li>Red Alerts are serious - false reports can have consequences</li>
                  <li>All Red Alerts are reviewed by Cliqstr's moderation team</li>
                  <li>Repeated violations may result in removal from the app</li>
                  <li>Parents are always notified when their child is involved in a Red Alert</li>
                  <li>Notifications are sent via both email and SMS for immediate attention</li>
                  <li>The system is designed to protect all children in the cliq</li>
                </ul>
              </div>
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
              <div className="bg-red-50 p-4 rounded-md">
                <p className="font-medium text-red-900">Red Alert Support</p>
                <p className="text-red-800">redalert@cliqstr.com</p>
                <p className="text-sm text-red-700 mt-1">
                  For urgent safety concerns or to report problem users.
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
