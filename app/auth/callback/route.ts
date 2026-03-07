import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const redirect = url.searchParams.get('redirect') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // GitHub OAuth 後にプロフィールが未作成なら作成
    if (data.user) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existing) {
        const githubUsername = data.user.user_metadata?.user_name ?? data.user.email?.split('@')[0] ?? 'user';
        const displayName = data.user.user_metadata?.full_name ?? githubUsername;
        const avatarUrl = data.user.user_metadata?.avatar_url ?? null;

        // ユーザー名が既存の場合はランダムサフィックスを追加
        let username = githubUsername.replace(/[^a-zA-Z0-9_-]/g, '-');
        const { data: taken } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single();
        if (taken) {
          username = `${username}-${Math.floor(Math.random() * 9999)}`;
        }

        await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          display_name: displayName,
          avatar_url: avatarUrl,
          github_url: `https://github.com/${githubUsername}`,
        });
      }
    }
  }

  return NextResponse.redirect(new URL(redirect, url.origin));
}
