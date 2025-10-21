export const dynamic = 'force-dynamic';

import ChildPermissionForm from '@/components/parents/ChildPermissionForm';

interface ChildEditPageProps {
  params: { id: string };
}

export default async function ChildEditPage({ params }: ChildEditPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <ChildPermissionForm
        mode="edit"
        childId={params.id}
      />
    </div>
  );
}
