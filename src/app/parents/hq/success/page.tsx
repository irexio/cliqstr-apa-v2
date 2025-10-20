"use client";

import Image from 'next/image';
import Link from 'next/link';

export default function ParentSuccessPage() {
  return (
    <main className="min-h-screen bg-white text-black font-poppins">
      <div className="mx-auto w-full max-w-screen-md px-6 py-12">
        {/* Logo */}
        <div className="flex w-full justify-center">
          <Image
            src="/MASTERLOGO-BLACK.png"
            alt="Cliqstr"
            width={285}
            height={75}
            priority
          />
        </div>

        {/* Hero */}
        <header className="mt-10 text-center">
          <h1 className="text-2xl font-bold">🎉 Congratulations!</h1>
          <p className="mt-4 text-base text-gray-800 leading-relaxed">
            Your child is now an approved member of <strong>Cliqstr</strong>.
          </p>
        </header>

        {/* What to do next */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">What to do next</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-800 leading-relaxed">
            <li>Help your child sign in and complete their profile with a photo and interests.</li>
            <li>Create your first <strong>Cliq</strong> — a safe group for family or friends.</li>
            <li>Invite others you trust to join and build a positive space together.</li>
          </ul>
        </section>

        {/* Silent Monitoring */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Silent Monitoring (Optional but Recommended)</h2>
          <p className="mt-3 text-gray-800 leading-relaxed">
            Silent Monitoring lets you quietly view your child’s activity without alerting them each time.
            Use it to stay informed, spot potential problems early, and build trust through conversation — not surveillance.
          </p>
          <p className="mt-2 text-gray-700">Enable this anytime in your <strong>Parents HQ Dashboard.</strong></p>
        </section>

        {/* Red Alerts */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">About Red Alerts</h2>
          <p className="mt-3 text-gray-800 leading-relaxed">
            If Cliqstr’s AI or moderators detect concerning activity, you’ll receive a <strong>Red Alert</strong>.
            Treat every alert seriously — they’re early signals that your child may need guidance or support.
          </p>
          <p className="mt-2 text-gray-700">Together, we can intervene before harm happens.</p>
        </section>

        {/* Partnership message */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">We’re in this together</h2>
          <p className="mt-3 text-gray-800 leading-relaxed">
            Cliqstr isn’t just a platform — it’s a partnership between families and technology.
            Your engagement keeps our community safe and helps kids learn how to navigate online life with confidence.
          </p>
        </section>

        {/* Buttons */}
        <section className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/parents/hq"
            className="inline-block rounded-2xl bg-black px-6 py-3 text-center font-semibold text-white transition-colors hover:text-[#c032d1]"
          >
            Go to Parents HQ
          </Link>
          <Link
            href="/my-cliqs-dashboard"
            className="inline-block rounded-2xl border border-black px-6 py-3 text-center font-medium text-black transition-colors hover:bg-gray-100"
          >
            Visit Dashboard
          </Link>
        </section>

        {/* Footer note */}
        <p className="mt-12 text-center text-sm text-gray-600 leading-relaxed">
          Built for families and friends — not followers.
        </p>
      </div>
    </main>
  );
}