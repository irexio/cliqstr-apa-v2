import { redirect } from 'next/navigation';

export default function SentinelPage() {
  redirect('/sentinel/users');
}
