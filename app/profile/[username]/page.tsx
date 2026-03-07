import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppGrid from '@/components/AppGrid';
import { Button } from '@/components/ui/button';
import type { App } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Github, Calendar } from 'lucide-react';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !profile) notFound();

  const [{ data: uploadedApps }, { data: likedAppIds }] = await Promise.all([
    supabase
      .from('apps')
      .select('*, profiles!apps_user_id_fkey(username, display_name, avatar_url)')
      .eq('user_id', profile.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
    supabase
      .from('likes')
      .select('app_id')
      .eq('user_id', profile.id),
  ]);

  let likedApps: App[] = [];
  if (likedAppIds && likedAppIds.length > 0) {
    const ids = likedAppIds.map(l => l.app_id);
    const { data } = await supabase
      .from('apps')
      .select('*, profiles!apps_user_id_fkey(username, display_name, avatar_url)')
      .in('id', ids)
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    likedApps = (data as App[]) ?? [];
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-5xl">
        {/* プロフィールヘッダー */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-12">
          <Avatar className="h-20 w-20 ring-2 ring-[color:var(--purple)]/30">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl">
              {profile.display_name?.[0]?.toUpperCase() ?? profile.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{profile.display_name ?? profile.username}</h1>
              <Badge variant="outline" className="text-xs">@{profile.username}</Badge>
            </div>

            {profile.bio && (
              <p className="text-muted-foreground mt-2">{profile.bio}</p>
            )}

            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(profile.created_at)} 参加
              </span>
              <span>{(uploadedApps?.length ?? 0)} アプリ</span>
            </div>

            {profile.github_url && (
              <div className="mt-3">
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Github className="h-4 w-4" />
                    GitHub
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* タブ */}
        <Tabs defaultValue="uploaded">
          <TabsList className="mb-8">
            <TabsTrigger value="uploaded">
              投稿したアプリ ({uploadedApps?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="liked">
              いいねしたアプリ ({likedApps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="uploaded">
            <AppGrid
              apps={(uploadedApps as App[]) ?? []}
              emptyMessage="まだアプリを投稿していません"
            />
          </TabsContent>

          <TabsContent value="liked">
            <AppGrid
              apps={likedApps}
              emptyMessage="いいねしたアプリがありません"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
