'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CATEGORIES, AI_TOOLS } from '@/lib/types';
import type { App } from '@/lib/types';
import { formatBytes } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Upload, X, ImageIcon, File } from 'lucide-react';
import Image from 'next/image';

export default function EditForm({ app }: { app: App }) {
  const router = useRouter();

  const [title, setTitle] = useState(app.title);
  const [description, setDescription] = useState(app.description ?? '');
  const [longDescription, setLongDescription] = useState(app.long_description ?? '');
  const [version, setVersion] = useState(app.version);
  const [githubUrl, setGithubUrl] = useState(app.github_url ?? '');
  const [webUrl, setWebUrl] = useState(app.web_url ?? '');
  const [selectedAiTools, setSelectedAiTools] = useState<string[]>(app.ai_tools ?? []);
  const [tags, setTags] = useState<string[]>(app.tags ?? []);
  const [tagInput, setTagInput] = useState('');

  // 新しいサムネイル（未選択なら既存を維持）
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(app.thumbnail_url);

  // 新しいアプリファイル（未選択なら既存を維持）
  const [newAppFile, setNewAppFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);

  const isWebApp = app.category === 'web';

  const { getRootProps: getThumbnailProps, getInputProps: getThumbnailInputProps } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
    onDrop: (accepted) => {
      if (accepted[0]) {
        setNewThumbnail(accepted[0]);
        setThumbnailPreview(URL.createObjectURL(accepted[0]));
      }
    },
    onDropRejected: () => toast.error('サムネイルは5MB以内のJPG/PNG/WEBPのみ'),
  });

  const { getRootProps: getFileProps, getInputProps: getFileInputProps } = useDropzone({
    maxSize: 500 * 1024 * 1024,
    maxFiles: 1,
    onDrop: (accepted) => { if (accepted[0]) setNewAppFile(accepted[0]); },
    onDropRejected: () => toast.error('ファイルは500MB以内のみ'),
    disabled: isWebApp,
  });

  const toggleAiTool = (tool: string) => {
    setSelectedAiTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= 5) return;
    setTags(prev => [...prev, tag]);
    setTagInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error('タイトルと説明は必須です');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('long_description', longDescription);
      fd.append('version', version);
      fd.append('github_url', githubUrl);
      fd.append('web_url', webUrl);
      fd.append('tags', JSON.stringify(tags));
      fd.append('ai_tools', JSON.stringify(selectedAiTools));
      if (newThumbnail) fd.append('thumbnail', newThumbnail);
      if (newAppFile) fd.append('file', newAppFile);

      const res = await fetch(`/api/apps/${app.id}`, { method: 'PATCH', body: fd });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? '更新に失敗しました');
        return;
      }

      toast.success('アプリを更新しました！');
      router.push(`/apps/${app.id}`);
      router.refresh();
    } catch {
      toast.error('エラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* タイトル */}
      <div className="space-y-2">
        <Label htmlFor="title">タイトル <span className="text-destructive">*</span></Label>
        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>

      {/* 説明 */}
      <div className="space-y-2">
        <Label htmlFor="description">
          説明 <span className="text-destructive">*</span>
          <span className="text-xs text-muted-foreground ml-2">{description.length}/200</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value.slice(0, 200))}
          rows={3}
          required
        />
      </div>

      {/* 詳細説明 */}
      <div className="space-y-2">
        <Label htmlFor="long_description">
          詳細説明 <span className="text-xs text-muted-foreground">（Markdown対応）</span>
        </Label>
        <Textarea
          id="long_description"
          value={longDescription}
          onChange={e => setLongDescription(e.target.value)}
          rows={8}
          className="font-mono text-sm"
        />
      </div>

      {/* サムネイル */}
      <div className="space-y-2">
        <Label>
          サムネイル
          <span className="text-xs text-muted-foreground ml-2">（変更する場合のみアップロード）</span>
        </Label>
        <div
          {...getThumbnailProps()}
          className={cn(
            'relative border-2 border-dashed rounded-xl cursor-pointer transition-all',
            thumbnailPreview ? 'border-[color:var(--purple)]/50' : 'border-border/50 hover:border-[color:var(--purple)]/50'
          )}
        >
          <input {...getThumbnailInputProps()} />
          {thumbnailPreview ? (
            <div className="relative aspect-video">
              <Image src={thumbnailPreview} alt="preview" fill className="object-cover rounded-xl" unoptimized />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setNewThumbnail(null); setThumbnailPreview(app.thumbnail_url); }}
                className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <p className="text-sm">クリックまたはドラッグ&ドロップ</p>
            </div>
          )}
        </div>
      </div>

      {/* アプリファイル */}
      {!isWebApp && (
        <div className="space-y-2">
          <Label>
            アプリファイル
            <span className="text-xs text-muted-foreground ml-2">（バージョン更新時のみアップロード）</span>
          </Label>

          {/* 現在のファイル */}
          {app.file_name && !newAppFile && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 text-sm">
              <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">現在: {app.file_name}</span>
              {app.file_size && <span className="text-xs text-muted-foreground ml-auto">{formatBytes(app.file_size)}</span>}
            </div>
          )}

          <div
            {...getFileProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all text-center',
              newAppFile ? 'border-[color:var(--purple)]/50 bg-[color:var(--purple)]/5' : 'border-border/50 hover:border-[color:var(--purple)]/50'
            )}
          >
            <input {...getFileInputProps()} />
            {newAppFile ? (
              <div className="flex items-center justify-center gap-3">
                <File className="h-6 w-6 text-[color:var(--purple)]" />
                <div>
                  <p className="font-medium text-sm">{newAppFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(newAppFile.size)}</p>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setNewAppFile(null); }} className="p-1 rounded-full hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <p className="text-sm">新しいファイルをドロップ（最大500MB）</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WebアプリURL */}
      {isWebApp && (
        <div className="space-y-2">
          <Label htmlFor="web_url">Webアプリ URL</Label>
          <Input id="web_url" type="url" value={webUrl} onChange={e => setWebUrl(e.target.value)} />
        </div>
      )}

      {/* AIツール */}
      <div className="space-y-2">
        <Label>使ったAIツール</Label>
        <div className="flex flex-wrap gap-2">
          {AI_TOOLS.map(tool => (
            <button
              key={tool}
              type="button"
              onClick={() => toggleAiTool(tool)}
              className={cn(
                'px-3 py-1.5 rounded-full border text-sm transition-all',
                selectedAiTools.includes(tool)
                  ? 'bg-[color:var(--cyan)]/20 border-[color:var(--cyan)] text-[color:var(--cyan)]'
                  : 'border-border/50 text-muted-foreground hover:border-[color:var(--cyan)]/50'
              )}
            >
              {tool}
            </button>
          ))}
        </div>
      </div>

      {/* タグ */}
      <div className="space-y-2">
        <Label>タグ <span className="text-xs text-muted-foreground">（最大5個）</span></Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder="タグを入力してEnter"
            disabled={tags.length >= 5}
          />
          <Button type="button" variant="outline" onClick={addTag} disabled={tags.length >= 5}>追加</Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                #{tag}
                <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* GitHub URL & バージョン */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="github_url">GitHub URL</Label>
          <Input id="github_url" type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="version">バージョン</Label>
          <Input id="version" value={version} onChange={e => setVersion(e.target.value)} placeholder="1.0.0" />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          キャンセル
        </Button>
        <Button
          type="submit"
          className="flex-1 gap-2 bg-[color:var(--purple)] hover:opacity-90 text-white"
          disabled={saving}
        >
          {saving ? '更新中...' : '変更を保存'}
        </Button>
      </div>
    </form>
  );
}
