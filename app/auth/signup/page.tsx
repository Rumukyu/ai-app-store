'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Github } from 'lucide-react';
import { toast } from 'sonner';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      toast.error('ユーザー名は3文字以上で入力してください');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      toast.error('ユーザー名は英数字、ハイフン、アンダースコアのみ使用できます');
      return;
    }
    setLoading(true);

    // ユーザー名の重複チェック
    const { data: existing } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existing) {
      toast.error('このユーザー名はすでに使われています');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // プロフィール作成
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        display_name: username,
      });
      if (profileError && !profileError.message.includes('duplicate')) {
        toast.error('プロフィールの作成に失敗しました');
        setLoading(false);
        return;
      }
      toast.success('登録完了！確認メールを送信しました');
      router.push('/');
    }
    setLoading(false);
  };

  const handleGitHubSignUp = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

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
          <h1 className="text-2xl font-bold">新規登録</h1>
          <p className="text-muted-foreground mt-1 text-sm">アカウントを作成してアプリを公開しよう</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleGitHubSignUp}
          >
            <Github className="h-4 w-4" />
            GitHub で登録
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-card px-3">または</span>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                type="text"
                placeholder="your-username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={3}
              />
              <p className="text-xs text-muted-foreground">英数字、ハイフン、アンダースコアのみ</p>
            </div>
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
                placeholder="8文字以上"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[color:var(--purple)] hover:opacity-90"
              disabled={loading}
            >
              {loading ? '登録中...' : 'アカウントを作成'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/auth/login" className="text-[color:var(--purple)] hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
