export const dynamic = 'force-dynamic';

import ParentsDashboard from '@/components/parents/ParentsDashboard';

interface ParentsHQPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ParentsHQPage({ searchParams }: ParentsHQPageProps) {
  const approvalToken = searchParams?.approvalToken as string || undefined;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <ParentsDashboard approvalToken={approvalToken} />
    </div>
  );
}
