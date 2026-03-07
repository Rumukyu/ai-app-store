import { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import AppGrid from '@/components/AppGrid';
import CategoryFilter from '@/components/CategoryFilter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { App } from '@/lib/types';
import { AI_TOOLS } from '@/lib/types';
import { Search } from 'lucide-react';
import Link from 'next/link';

interface SearchParams {
  q?: string;
  category?: string;
  ai?: string;
  sort?: string;
  page?: string;
}

const PAGE_SIZE = 20;

async function AppsContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createServerSupabaseClient();

  const page = parseInt(searchParams.page ?? '1');
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('apps')
    .select('*, profiles!apps_user_id_fkey(username, display_name, avatar_url)', { count: 'exact' })
    .eq('status', 'published');

  if (searchParams.category) {
    query = query.eq('category', searchParams.category);
  }

  if (searchParams.ai) {
    query = query.contains('ai_tools', [searchParams.ai]);
  }

  if (searchParams.q) {
    query = query.textSearch('fts', searchParams.q, { config: 'simple' });
  }

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    downloads: { column: 'download_count', ascending: false },
    likes: { column: 'like_count', ascending: false },
    newest: { column: 'created_at', ascending: false },
  };
  const sort = sortMap[searchParams.sort ?? 'newest'] ?? sortMap.newest;
  query = query.order(sort.column, { ascending: sort.ascending });

  query = query.range(offset, offset + PAGE_SIZE - 1);

  const { data: apps, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <>
      <AppGrid apps={(apps as App[]) ?? []} />
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Link href={`/apps?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}>
              <Button variant="outline" size="sm">前へ</Button>
            </Link>
          )}
          <span className="flex items-center text-sm text-muted-foreground px-4">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/apps?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}>
              <Button variant="outline" size="sm">次へ</Button>
            </Link>
          )}
        </div>
      )}
    </>
  );
}

export default async function AppsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sorts = [
    { id: 'newest', label: '新着順' },
    { id: 'downloads', label: 'DL数順' },
    { id: 'likes', label: 'いいね順' },
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold mb-8">アプリ一覧</h1>

        {/* 検索バー */}
        <form method="GET" className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={params.q}
            placeholder="アプリを検索..."
            className="pl-10"
          />
        </form>

        {/* カテゴリフィルター */}
        <Suspense>
          <CategoryFilter />
        </Suspense>

        {/* AIツールフィルター & ソート */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4 mb-6">
          <div className="flex flex-wrap gap-2 flex-1">
            <span className="text-sm text-muted-foreground self-center">AIツール:</span>
            {AI_TOOLS.map(tool => (
              <Link
                key={tool}
                href={`/apps?${new URLSearchParams({ ...params, ai: params.ai === tool ? '' : tool }).toString()}`}
              >
                <Badge
                  variant={params.ai === tool ? 'default' : 'outline'}
                  className={
                    params.ai === tool
                      ? 'bg-[color:var(--cyan)] text-background cursor-pointer'
                      : 'border-[color:var(--cyan)]/30 text-[color:var(--cyan)] cursor-pointer hover:border-[color:var(--cyan)]'
                  }
                >
                  {tool}
                </Badge>
              </Link>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">ソート:</span>
            {sorts.map(s => (
              <Link
                key={s.id}
                href={`/apps?${new URLSearchParams({ ...params, sort: s.id, page: '1' })}`}
              >
                <Button
                  variant={(params.sort ?? 'newest') === s.id ? 'default' : 'outline'}
                  size="sm"
                  className={(params.sort ?? 'newest') === s.id ? 'bg-[color:var(--purple)]' : ''}
                >
                  {s.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card animate-pulse">
                <div className="aspect-video bg-muted rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        }>
          <AppsContent searchParams={params} />
        </Suspense>
      </div>
    </div>
  );
}
