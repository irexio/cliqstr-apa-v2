'use client';
import Link from 'next/link';

export function WaitlistFooter() {
  return (
    <footer className="bg-[#202020] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand / Intro */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img src="/MASTERLOGO-WHITE.png" alt="Cliqstr" className="h-6 sm:h-7 md:h-8 lg:h-9 w-auto" />
            </div>
            <p className="text-sm text-neutral-300">
              Cliqstr is a private social platform for families, friends, and safe online communities.
            </p>

            <p className="text-sm font-semibold text-[#c032d1] mt-6">
              🚧 <span className="text-base font-bold">Currently in Beta</span>
            </p>

            <div className="space-y-1 text-sm text-neutral-300">
              <p>
                Interested in what we’re building?{' '}
                <a href="mailto:inquiry@cliqstr.com" className="underline hover:text-white">inquiry@cliqstr.com</a>
              </p>
              <p>
                Want to join our team?{' '}
                <a href="mailto:wizards@cliqstr.com" className="underline hover:text-white">wizards@cliqstr.com</a>
              </p>
              <p>
                💌 Parent/Guardian Early Access Testers{' '}
                <a href="mailto:testers@cliqstr.com" className="underline hover:text-white">testers@cliqstr.com</a>
              </p>
            </div>
          </div>

          {/* Pages */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Pages</h3>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li><Link href="/under-development" className="hover:text-white transition">Explore Public Cliqs</Link></li>
              <li><Link href="/under-development" className="hover:text-white transition">How It Works</Link></li>
              <li><Link href="/under-development" className="hover:text-white transition">About</Link></li>
              <li><Link href="/under-development" className="hover:text-white transition">FAQs</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li><Link href="/under-development" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/under-development" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link href="/under-development" className="hover:text-white transition">Cliqstr Safety</Link></li>
            </ul>
          </div>

          {/* Call to Action */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Start Your Cliq</h3>
            <p className="text-sm text-neutral-300 mb-4">Create a private space for the people you trust most.</p>
            <Link
              href="/sign-up"
              className="inline-block bg-[#c032d1] text-white px-4 py-2 rounded-md font-medium hover:bg-[#b155c9] transition"
            >
              Start Free Trial
            </Link>
            <p className="text-xs text-neutral-400 mt-2">Public redirect may route / to /Waitlist during preview.</p>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-12 border-top pt-6 text-xs text-neutral-400 text-center border-t border-neutral-800">
          &copy; {new Date().getFullYear()} Cliqstr. Built with ❤️ for families and friends.
        </div>
      </div>
    </footer>
  );
}
