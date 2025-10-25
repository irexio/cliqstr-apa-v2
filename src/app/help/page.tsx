'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from '@/components/ui/use-toast';

export default function HelpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/help/resend-approval-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Unable to resend link',
          description: data.error || 'Please try again or contact support',
        });
        setLoading(false);
        return;
      }

      setSubmitted(true);
      toast({
        title: 'Link sent',
        description: 'Check your email for a link to continue setting up your child.',
      });
      setEmail('');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-black">Help</h1>
          <p className="text-gray-600 mt-2">Get answers to common questions</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Lost Approval Link Section */}
        <section className="mb-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6 text-magenta-600 mt-1">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-black mb-4">
                  Lost Your Approval Link?
                </h2>
                <p className="text-gray-700 mb-6">
                  If you started setting up a child account but lost the email or it expired, enter your email address below and we'll send you a new link to continue.
                </p>

                <form onSubmit={handleResendLink} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-black mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="parent@example.com"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magenta-600 focus:border-transparent outline-none text-black placeholder-gray-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || submitted}
                    className="w-full bg-black text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-800 disabled:bg-gray-400 transition"
                  >
                    {loading ? 'Sending...' : submitted ? 'Link sent' : 'Send recovery link'}
                  </button>
                </form>

                <p className="text-sm text-gray-600 mt-4">
                  Check your email (including spam folder) for a link to resume your setup.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">
                How long does the approval link last?
              </h3>
              <p className="text-gray-700">
                Approval links expire after 7 days. If your link has expired, use the recovery form above to request a new one.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-black mb-2">
                I already have an account. What do I do?
              </h3>
              <p className="text-gray-700">
                If you have an existing Cliqstr account, you can click the "Already have account? Resume here" link in the approval email to log in and continue setting up your child.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-black mb-2">
                What if I can't find the email?
              </h3>
              <p className="text-gray-700">
                Check your spam or promotions folder. If you still can't find it, use the recovery form above and we'll send you a new link.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-black mb-2">
                Do I need a credit card?
              </h3>
              <p className="text-gray-700">
                Yes. To verify your identity and create a parent account, we require a credit card. Cliqstr includes a free 30-day trial for all new parents.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-black mb-2">
                Can I set up multiple children?
              </h3>
              <p className="text-gray-700">
                Absolutely. Once your account is set up, you can add as many children as you need through Parent HQ. Each child has their own permissions and settings.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-black mb-2">
                What if the signup flow broke mid-process?
              </h3>
              <p className="text-gray-700">
                If your connection dropped or something interrupted the process, use the recovery form above or try logging in to your existing account to resume. You can also contact support for help.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="bg-black text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="mb-6 text-gray-200">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <a
            href="mailto:support@cliqstr.com"
            className="inline-block bg-magenta-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-magenta-700 transition"
          >
            Contact support
          </a>
        </section>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-black hover:text-gray-700 font-medium underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
