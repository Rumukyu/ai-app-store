'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Github } from 'lucide-react';
import { toast } from 'sonner';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      router.push(redirect);
      router.refresh();
    }
    setLoading(false);
  };

  const handleGitHubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${location.origin}/auth/callback?redirect=${redirect}` },
    });
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
      <Button variant="outline" className="w-full gap-2" onClick={handleGitHubLogin}>
        <Github className="h-4 w-4" />
        GitHub でログイン
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs text-muted-foreground">
          <span className="bg-card px-3">または</span>
        </div>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-[color:var(--purple)] hover:opacity-90"
          disabled={loading}
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Zap className="h-6 w-6 text-[color:var(--purple)]" />
            <span className="text-xl font-bold bg-gradient-to-r from-[color:var(--purple)] to-[color:var(--cyan)] bg-clip-text text-transparent">
              AIAppStore
            </span>
          </Link>
          <h1 className="text-2xl font-bold">ログイン</h1>
          <p className="text-muted-foreground mt-1 text-sm">アカウントにサインイン</p>
        </div>

        <Suspense fallback={
          <div className="rounded-xl border border-border/50 bg-card p-6 text-center text-muted-foreground">
            読み込み中...
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-muted-foreground mt-6">
          アカウントをお持ちでない方は{' '}
          <Link href="/auth/signup" className="text-[color:var(--purple)] hover:underline">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
