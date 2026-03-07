'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Upload, Zap, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setUsername(data?.username ?? null));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setUsername(data?.username ?? null));
      } else {
        setUsername(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-[color:var(--purple)]" />
            <span className="text-xl font-bold bg-gradient-to-r from-[color:var(--purple)] to-[color:var(--cyan)] bg-clip-text text-transparent">
              AIAppStore
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/apps" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              アプリ一覧
            </Link>
            <Link href="/apps/upload">
              <Button size="sm" className="gap-2 bg-[color:var(--purple)] hover:opacity-90">
                <Upload className="h-4 w-4" />
                アップロード
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-muted text-xs">
                        {username?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {username && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/profile/${username}`}>プロフィール</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">ログイン</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" variant="outline">新規登録</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-muted-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 space-y-3">
            <Link href="/apps" className="block text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>
              アプリ一覧
            </Link>
            <Link href="/apps/upload" className="block text-sm" onClick={() => setMenuOpen(false)}>
              アップロード
            </Link>
            {user ? (
              <>
                {username && (
                  <Link href={`/profile/${username}`} className="block text-sm" onClick={() => setMenuOpen(false)}>
                    プロフィール
                  </Link>
                )}
                <button onClick={handleSignOut} className="block text-sm text-destructive">
                  ログアウト
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" size="sm">ログイン</Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setMenuOpen(false)}>
                  <Button size="sm" variant="outline">新規登録</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
