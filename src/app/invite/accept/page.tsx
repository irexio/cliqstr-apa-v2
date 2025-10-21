import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import InviteAcceptClient from './_client';

export default async function InviteAcceptPage() {
  const user = await getCurrentUser();
  // ✅ NOTE: We do NOT enforce APA here because unauthenticated users need to click invite links
  // The client-side logic in _client.tsx handles routing appropriately based on auth status
  return <InviteAcceptClient />;
}
