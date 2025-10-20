'use client';
import Link from 'next/link';

export function WaitlistHeader() {
  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center" aria-label="Cliqstr Home">
            <span className="p-1">
              <img src="/MASTERLOGO-BLACK.png" alt="Cliqstr" className="block h-9 sm:h-10 md:h-12 lg:h-12 w-auto object-contain" />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
