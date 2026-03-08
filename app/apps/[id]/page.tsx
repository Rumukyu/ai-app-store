import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CATEGORIES } from '@/lib/types';
import type { App, Comment } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/utils';
import { Download, Heart, Github, Globe, Calendar, HardDrive, Pencil } from 'lucide-react';
import LikeButton from './LikeButton';
import DeleteButton from './DeleteButton';
import CommentSection from './CommentSection';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AppGrid from '@/components/AppGrid';

const siteUrl = 'https://appstore-sage.vercel.app';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: app } = await supabase
    .from('apps')
    .select('title, description, thumbnail_url, version, profiles!apps_user_id_fkey(display_name, username)')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (!app) return {};

  const profiles = app.profiles as unknown as { display_name: string | null; username: string } | null;
  const author = profiles?.display_name ?? profiles?.username ?? '';
  const title = `${app.title} v${app.version}`;
  const description = app.description ?? `${author}が作ったAIアプリ「${app.title}」をダウンロード・レビューしよう`;
  const image = app.thumbnail_url ?? `${siteUrl}/og-image.png`;
  const url = `${siteUrl}/apps/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: app.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: app, error } = await supabase
    .from('apps')
    .select('*, profiles!apps_user_id_fkey(id, username, display_name, avatar_url, github_url)')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (error || !app) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  // いいね状態
  let liked = false;
  if (user) {
    const { data: like } = await supabase
      .from('likes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('app_id', id)
      .single();
    liked = !!like;
  }

  // コメント一覧
  const { data: comments } = await supabase
    .from('comments')
    .select('*, profiles!comments_user_id_fkey(username, display_name, avatar_url)')
    .eq('app_id', id)
    .order('created_at', { ascending: true });

  // 作者の他のアプリ
  const { data: authorApps } = await supabase
    .from('apps')
    .select('*, profiles!apps_user_id_fkey(username, display_name, avatar_url)')
    .eq('user_id', (app as App & { profiles: { id: string } }).profiles?.id ?? '')
    .eq('status', 'published')
    .neq('id', id)
    .limit(4);

  const category = CATEGORIES.find(c => c.id === app.category);
  const typedApp = app as App & { profiles: { id: string; username: string; display_name: string | null; avatar_url: string | null; github_url: string | null } };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-8">
            {/* サムネイル */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border/50">
              {typedApp.thumbnail_url ? (
                <Image
                  src={typedApp.thumbnail_url}
                  alt={typedApp.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-8xl">
                  {category?.icon ?? '📦'}
                </div>
              )}
            </div>

            {/* タイトル & メタ */}
            <div>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-bold">{typedApp.title}</h1>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(typedApp.created_at)}
                    </span>
                    {typedApp.file_size && (
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3.5 w-3.5" />
                        {formatBytes(typedApp.file_size)}
                      </span>
                    )}
                    <span>v{typedApp.version}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {category?.icon} {category?.label}
                </Badge>
              </div>

              {/* AI ツールバッジ */}
              {typedApp.ai_tools && typedApp.ai_tools.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-xs text-muted-foreground self-center">使ったAI:</span>
                  {typedApp.ai_tools.map(tool => (
                    <Badge
                      key={tool}
                      variant="outline"
                      className="border-[color:var(--cyan)]/40 text-[color:var(--cyan)]"
                    >
                      {tool}
                    </Badge>
                  ))}
                </div>
              )}

              {/* タグ */}
              {typedApp.tags && typedApp.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {typedApp.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 説明文 */}
            {typedApp.description && (
              <p className="text-muted-foreground">{typedApp.description}</p>
            )}

            {/* 詳細説明 Markdown */}
            {typedApp.long_description && (
              <>
                <Separator />
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {typedApp.long_description}
                  </ReactMarkdown>
                </div>
              </>
            )}

            <Separator />

            {/* コメント */}
            <CommentSection
              appId={id}
              comments={(comments as Comment[]) ?? []}
              userId={user?.id}
            />
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* ダウンロード & いいね */}
            <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
              {typedApp.web_url ? (
                <a href={typedApp.web_url} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full gap-2 bg-[color:var(--purple)] hover:opacity-90">
                    <Globe className="h-4 w-4" />
                    Webアプリを開く
                  </Button>
                </a>
              ) : (
                <a href={`/api/download/${id}`}>
                  <Button className="w-full gap-2 bg-[color:var(--purple)] hover:opacity-90">
                    <Download className="h-4 w-4" />
                    ダウンロード
                    {typedApp.file_size && (
                      <span className="text-xs opacity-70">({formatBytes(typedApp.file_size)})</span>
                    )}
                  </Button>
                </a>
              )}

              <LikeButton
                appId={id}
                likeCount={typedApp.like_count}
                initialLiked={liked}
                userId={user?.id}
              />

              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Download className="h-3.5 w-3.5" />
                  {typedApp.download_count.toLocaleString()} DL
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {typedApp.like_count.toLocaleString()} いいね
                </span>
              </div>

              {typedApp.github_url && (
                <a href={typedApp.github_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    <Github className="h-4 w-4" />
                    GitHub
                  </Button>
                </a>
              )}

              {/* オーナーのみ編集・削除ボタン表示 */}
              {user?.id === typedApp.user_id && (
                <div className="space-y-2">
                  <Link href={`/apps/${id}/edit`}>
                    <Button variant="outline" className="w-full gap-2">
                      <Pencil className="h-4 w-4" />
                      編集する
                    </Button>
                  </Link>
                  <DeleteButton appId={id} />
                </div>
              )}
            </div>

            {/* 作者情報 */}
            {typedApp.profiles && (
              <div className="rounded-xl border border-border/50 bg-card p-6">
                <h3 className="text-sm font-medium mb-4 text-muted-foreground">作者</h3>
                <Link href={`/profile/${typedApp.profiles.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <Avatar>
                    <AvatarImage src={typedApp.profiles.avatar_url ?? undefined} />
                    <AvatarFallback>
                      {typedApp.profiles.display_name?.[0]?.toUpperCase() ?? typedApp.profiles.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{typedApp.profiles.display_name ?? typedApp.profiles.username}</p>
                    <p className="text-xs text-muted-foreground">@{typedApp.profiles.username}</p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 作者の他のアプリ */}
        {authorApps && authorApps.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold mb-6">作者の他のアプリ</h2>
            <AppGrid apps={authorApps as App[]} />
          </div>
        )}
      </div>
    </div>
  );
}
