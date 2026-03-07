import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { App } from '@/lib/types';
import EditForm from './EditForm';

export default async function EditAppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/apps/${id}/edit`);

  const { data: app, error } = await supabase
    .from('apps')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !app) notFound();
  if (app.user_id !== user.id) notFound();

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">アプリを編集</h1>
        <EditForm app={app as App} />
      </div>
    </div>
  );
}
