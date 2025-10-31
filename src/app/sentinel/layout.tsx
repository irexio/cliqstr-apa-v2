'use client';

import { SentinelGuard } from '@/components/auth/SentinelGuard';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const tabs = [
  { name: 'Users', href: '/sentinel/users' },
  { name: 'Cliqs', href: '/sentinel/cliqs' },
  { name: 'Profiles', href: '/sentinel/profiles' },
  { name: 'Posts', href: '/sentinel/posts' },
  { name: 'Images', href: '/sentinel/images' },
  { name: 'Announcements', href: '/sentinel/announcements' },
  { name: 'Games', href: '/sentinel/games' },
  { name: 'System', href: '/sentinel/system' },
];

export default function SentinelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SentinelGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Sentinel Dashboard</h1>
            <div className="text-sm text-gray-500">SuperAdmin Control Panel</div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="bg-white border-b border-gray-200 sticky top-[65px] z-30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                      isActive
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-600 hover:text-black'
                    }`}
                  >
                    {tab.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </div>
    </SentinelGuard>
  );
}
