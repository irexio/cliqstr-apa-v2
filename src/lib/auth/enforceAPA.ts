import { redirect } from 'next/navigation';

export function enforceAPA(user: any, approvalToken?: string) {
  // Allow access if there's an approval token (for new parent signup flow)
  if (!user && approvalToken) {
    return; // Don't redirect, allow access
  }
  
  if (!user) redirect('/sign-in');
  
  const role = user.account?.role;
  const approved = !!user.account?.isApproved;
  const plan = user.account?.plan;
  
  // 🚫 CRITICAL: Block unapproved children
  if (role === 'Child' && !approved) {
    console.log('[ENFORCE-APA] Blocking unapproved child');
    redirect('/awaiting-approval');
  }
  
  // 🚫 CRITICAL: Block users without a plan - NO EXCEPTIONS
  if (!plan || plan === null || plan === '') {
    console.log('[ENFORCE-APA] Blocking user without plan:', { plan, role, approved });
    redirect('/choose-plan');
  }
  
  // ✅ User has valid plan - allow access
  console.log('[ENFORCE-APA] User has valid plan:', { plan, role, approved });
}

export function clearAuthTokens(headers: Headers): void {
  headers.append('Set-Cookie', 'resetToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  headers.append('Set-Cookie', 'authToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
}
