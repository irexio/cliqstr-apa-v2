'use client';

import Link from 'next/link';
import { useState } from 'react';
import FeedbackModal from '@/components/FeedbackModal';

export default function AccountClient({ user }: { user: any }) {
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>

      {/* Account Overview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Overview</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Email:</span>
            <span className="text-sm text-gray-900">{user.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Role:</span>
            <span className="text-sm text-gray-900 capitalize">{user.account?.role ?? user.role}</span>
          </div>
          {user.account?.stripeStatus && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Plan:</span>
              <span className="text-sm text-gray-900 capitalize">{user.account.stripeStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Account Management Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email & Password */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Login & Security</h3>
          <div className="space-y-3">
            <Link
              href="/account/email"
              className="block p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Change Email</div>
              <div className="text-sm text-gray-600">Update your account email address</div>
            </Link>
            {/* TODO: Wire to Resend-backed email change verification flow */}

            <Link
              href="/account/password"
              className="block p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Change Password</div>
              <div className="text-sm text-gray-600">Update your account password</div>
            </Link>
            {/* TODO: Route to /reset-password or trigger password reset via Resend */}

            <Link
              href="/account/security"
              className="block p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Security Settings</div>
              <div className="text-sm text-gray-600">Manage sessions and security options</div>
            </Link>
            {/* TODO: Implement session listing and device management */}
          </div>
        </div>

        {/* Billing & Plans */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing & Plans</h3>
          <div className="space-y-3">
            <Link
              href="/choose-plan"
              className="block p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Billing & Plans</div>
              <div className="text-sm text-gray-600">Manage your subscription and billing</div>
            </Link>
            {/* TODO: If Stripe customer portal is configured, link there instead */}

            <div className="p-3 rounded-md border border-gray-200 bg-gray-50">
              <div className="font-medium text-gray-500">Account Actions</div>
              <div className="text-sm text-gray-500">Suspend or delete account (coming soon)</div>
              {/* TODO: Add suspend/delete account controls with confirmations */}
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific sections (optional) */}
      {String(user.account?.role ?? user.role).toLowerCase() === 'parent' && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent Features</h3>
          <Link
            href="/parents/hq"
            className="block p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">⚡ Parents HQ</div>
            <div className="text-sm text-gray-600">Manage your children's accounts, safety settings, and monitor activity</div>
          </Link>
        </div>
      )}

      {/* Support & Feedback */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Support & Feedback</h3>
        <div className="space-y-3">
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="block w-full p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="font-medium text-gray-900">Send Feedback</div>
            <div className="text-sm text-gray-600">Report bugs, share ideas, or send general comments</div>
          </button>
          
          <Link
            href="/parents/hq/help"
            className="block p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">Help Center</div>
            <div className="text-sm text-gray-600">Find answers to common questions</div>
          </Link>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)} 
      />
    </main>
  );
}


