import { redirect } from 'next/navigation';

export default async function ProfesionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;
  redirect(`/estudiante?id=${resolved.id}`);
}
