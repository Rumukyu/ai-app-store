'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DeleteButton({ appId }: { appId: string }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/apps/${appId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? '削除に失敗しました');
        return;
      }
      toast.success('アプリを削除しました');
      router.push('/apps');
      router.refresh();
    } catch {
      toast.error('エラーが発生しました');
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 border-destructive/50 text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
          削除する
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>アプリを削除しますか？</DialogTitle>
          <DialogDescription>
            この操作は取り消せません。アプリのファイル・いいね・コメントが全て削除されます。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? '削除中...' : '削除する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
