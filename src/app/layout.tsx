// 🔐 APA-HARDENED by Aiden — Do not remove without layout review.
// This is the root layout for Cliqstr — imports Tailwind, font, global rules,
// and safely applies header/footer framing for every route.


import './globals.css'; // Required for font + resets
import '@uploadthing/react/styles.css';

import { Poppins } from 'next/font/google';
import type { Metadata } from 'next';
import { Suspense } from 'react';
// Import from the wrapper which should handle the re-export
// Version: 2024.1.27.1
import SessionProvider from '@/components/SessionProvider';
import AppFrame from '@/components/AppFrame';
import { ConvexClientProvider } from '@/components/providers/ConvexProvider';
import { AuthProvider } from '@/lib/auth/useAuth';
import ParentSetupGuard from '@/components/auth/ParentSetupGuard';


const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Cliqstr',
  description: 'Private social media for families and kids',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="text-[#202020] font-poppins antialiased">
        <ConvexClientProvider>
          <SessionProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <AuthProvider>
                <ParentSetupGuard />
                <AppFrame>{children}</AppFrame>
              </AuthProvider>
            </Suspense>
          </SessionProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
