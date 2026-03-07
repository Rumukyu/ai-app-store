import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import AppGrid from '@/components/AppGrid';
import { Button } from '@/components/ui/button';
import { CATEGORIES } from '@/lib/types';
import type { App } from '@/lib/types';
import { Upload, ArrowRight } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const [{ data: newApps }, { data: popularApps }] = await Promise.all([
    supabase
      .from('apps')
      .select('*, profiles!apps_user_id_fkey(username, display_name, avatar_url)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('apps')
      .select('*, profiles!apps_user_id_fkey(username, display_name, avatar_url)')
      .eq('status', 'published')
      .order('download_count', { ascending: false })
      .limit(8),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--purple)]/10 via-transparent to-[color:var(--cyan)]/10 pointer-events-none" />
        <div className="mx-auto max-w-4xl text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[color:var(--purple)]/30 bg-[color:var(--purple)]/10 text-sm text-[color:var(--purple)] mb-6">
            <span>✨</span>
            <span>AI × クリエイティビティ</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            AIで作ったアプリを
            <br />
            <span className="bg-gradient-to-r from-[color:var(--purple)] to-[color:var(--cyan)] bg-clip-text text-transparent">
              シェアしよう
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Claude、ChatGPT、Cursor など AIツールで作ったアプリを公開・共有・ダウンロードできるプラットフォーム
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apps/upload">
              <Button size="lg" className="gap-2 bg-[color:var(--purple)] hover:opacity-90 text-white">
                <Upload className="h-5 w-5" />
                アプリをアップロード
              </Button>
            </Link>
            <Link href="/apps">
              <Button size="lg" variant="outline" className="gap-2">
                アプリを見る
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* カテゴリショートカット */}
      <section className="py-12 px-4 border-y border-border/50">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap justify-center gap-4">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                href={`/apps?category=${cat.id}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 hover:border-[color:var(--purple)]/50 hover:bg-[color:var(--purple)]/5 transition-all w-24"
              >
                <img src={cat.iconUrl} alt={cat.label} className="w-8 h-8" />
                <span className="text-xs text-muted-foreground">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 新着アプリ */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-[color:var(--purple)] to-[color:var(--cyan)] bg-clip-text text-transparent">新着</span>
              アプリ
            </h2>
            <Link href="/apps" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              すべて見る <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <AppGrid apps={(newApps as App[]) ?? []} emptyMessage="まだアプリがありません。最初のアプリをアップロードしよう！" />
        </div>
      </section>

      {/* 人気アプリ */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">
              🔥 人気アプリ <span className="text-muted-foreground text-lg font-normal">TOP8</span>
            </h2>
            <Link href="/apps?sort=downloads" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              すべて見る <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <AppGrid apps={(popularApps as App[]) ?? []} emptyMessage="まだアプリがありません" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">あなたのAIアプリを公開しよう</h2>
          <p className="text-muted-foreground mb-8">
            作ったアプリを世界中の人にシェア。フィードバックをもらおう。
          </p>
          <Link href="/apps/upload">
            <Button size="lg" className="gap-2 bg-[color:var(--purple)] hover:opacity-90 text-white">
              <Upload className="h-5 w-5" />
              今すぐアップロード
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
