'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  appId: string;
  likeCount: number;
  initialLiked: boolean;
  userId?: string;
}

export default function LikeButton({ appId, likeCount, initialLiked, userId }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(likeCount);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLike = async () => {
    if (!userId) {
      toast.error('いいねするにはログインが必要です');
      router.push('/auth/login');
      return;
    }

    setLoading(true);

    if (liked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('app_id', appId);
      if (!error) {
        setLiked(false);
        setCount(c => c - 1);
        // like_count を更新
        await supabase.from('apps').update({ like_count: count - 1 }).eq('id', appId);
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ user_id: userId, app_id: appId });
      if (!error) {
        setLiked(true);
        setCount(c => c + 1);
        await supabase.from('apps').update({ like_count: count + 1 }).eq('id', appId);
      }
    }

    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      className={cn(
        'w-full gap-2',
        liked && 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
      )}
      onClick={handleLike}
      disabled={loading}
    >
      <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
      {liked ? 'いいね済み' : 'いいね'}
      <span className="text-muted-foreground text-xs">({count})</span>
    </Button>
  );
}
