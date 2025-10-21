export const dynamic = 'force-dynamic';

import ChildPermissionForm from '@/components/parents/ChildPermissionForm';

interface ChildCreatePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ChildCreatePage({ searchParams }: ChildCreatePageProps) {
  const approvalToken = searchParams?.approvalToken as string || undefined;
  const inviteCode = searchParams?.inviteCode as string || undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <ChildPermissionForm
        mode="create"
        approvalToken={approvalToken}
        inviteCode={inviteCode}
      />
    </div>
  );
}
