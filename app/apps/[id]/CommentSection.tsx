'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import type { Comment } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';

interface CommentSectionProps {
  appId: string;
  comments: Comment[];
  userId?: string;
}

export default function CommentSection({ appId, comments: initialComments, userId }: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error('コメントするにはログインが必要です');
      router.push('/auth/login');
      return;
    }
    if (!content.trim()) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({ app_id: appId, user_id: userId, content: content.trim() })
      .select('*, profiles!comments_user_id_fkey(username, display_name, avatar_url)')
      .single();

    if (error) {
      toast.error('コメントの投稿に失敗しました');
    } else {
      setComments(prev => [...prev, data as Comment]);
      setContent('');
      toast.success('コメントを投稿しました');
    }
    setSubmitting(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5" />
        コメント ({comments.length})
      </h2>

      {comments.length > 0 && (
        <div className="space-y-4 mb-8">
          {comments.map((comment, i) => (
            <div key={comment.id}>
              <div className="flex gap-3">
                <Link href={`/profile/${comment.profiles?.username}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.profiles?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {comment.profiles?.display_name?.[0]?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/profile/${comment.profiles?.username}`} className="text-sm font-medium hover:underline">
                      {comment.profiles?.display_name ?? comment.profiles?.username ?? 'ユーザー'}
                    </Link>
                    <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
              {i < comments.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      )}

      {/* コメント投稿フォーム */}
      {userId ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="コメントを書く..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{content.length}/500</span>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !content.trim()}
              className="bg-[color:var(--purple)] hover:opacity-90"
            >
              {submitting ? '投稿中...' : '投稿'}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          <Link href="/auth/login" className="text-[color:var(--purple)] hover:underline">ログイン</Link>
          してコメントを投稿しよう
        </p>
      )}
    </div>
  );
}
