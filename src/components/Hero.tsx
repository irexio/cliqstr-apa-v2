'use client'

// 🔐 APA-HARDENED by Aiden — Do not remove without explicit security review.
// Hero section for Cliqstr homepage. Uses official Kara color gradient.

import Link from 'next/link'

type HeroProps = {
  showCTAs?: boolean;
};

export function Hero({ showCTAs = true }: HeroProps) {
  return (
    <section className="bg-gradient-to-br from-blue-900 via-purple-600 to-pink-600 text-white py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center space-y-6">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold leading-tight md:leading-[1.15]">
          <span>Social Media With</span>
          <br />
          <span>
            <span className="text-gray-200">Privacy</span> at Its Core
          </span>
        </h1>
        <p className="text-lg sm:text-xl md:text-xl max-w-2xl mx-auto opacity-90">
          No stalkers, No Hawkers. Just your cliqs. Connect privately with the people who matter most to you, without all the noise.
        </p>
        {showCTAs && (
          <div className="flex justify-center gap-4 flex-wrap pt-4">
            <Link
              href="/sign-up"
              className="rounded-full bg-white text-black font-semibold px-6 py-3 text-lg shadow-md hover:bg-gray-100 transition"
            >
              Try Cliqstr Free
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-white text-white font-medium px-6 py-3 text-lg hover:bg-white hover:text-black transition"
            >
              Learn More
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
