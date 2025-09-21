import { redirect } from 'next/navigation';

export function enforceAPA(user: any, approvalToken?: string) {
  // Allow access if there's an approval token (for new parent signup flow)
  if (!user && approvalToken) {
    return; // Don't redirect, allow access
  }
  
  if (!user) redirect('/sign-in');
  const role = user.account?.role;
  const approved = !!user.account?.isApproved;
  if (role === 'Child' && !approved) redirect('/awaiting-approval');
  if (!user.account?.plan) redirect('/choose-plan');
}

export function clearAuthTokens(headers: Headers): void {
  headers.append('Set-Cookie', 'resetToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  headers.append('Set-Cookie', 'authToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
}
