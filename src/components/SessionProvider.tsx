'use client';

import { useState, useEffect } from 'react';
import AutoLogout from '@/lib/auth/auto-logout';

interface SessionProviderProps {
  children: React.ReactNode;
}

import { useRouter } from 'next/navigation';

export default function SessionProvider({ children }: SessionProviderProps) {
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [suspended, setSuspended] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch the user session on component mount
  useEffect(() => {
    async function fetchUserSession() {
      try {
        let res = await fetch('/api/auth/status');
        if (!res.ok) {
          res = await fetch('/api/auth/status');
        }
        if (res.ok) {
          const data = await res.json();
          if (data.isAuthenticated && data.user?.account?.role) {
            setUserRole(data.user.account.role);
          }
          if (data.user?.account?.suspended) {
            setSuspended(true);
            // Optionally redirect to /suspended
            if (window.location.pathname !== '/suspended') {
              router.replace('/suspended');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUserSession();
  }, [router]);

  return (
    <>
      {/* Apply auto-logout for authenticated users */}
      {userRole && <AutoLogout userRole={userRole} />}
      {/* Suspended banner */}
      {suspended && (
        <div className="bg-red-100 text-red-800 text-center p-2 font-bold z-50">
          Your account has been suspended by a parent or administrator.
        </div>
      )}
      {children}
    </>
  );
}

