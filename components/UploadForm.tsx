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
import { formatBytes } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Upload, X, ImageIcon, File } from 'lucide-react';
import Image from 'next/image';

export default function UploadForm() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [category, setCategory] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [selectedAiTools, setSelectedAiTools] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [appFile, setAppFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectedCategory = CATEGORIES.find(c => c.id === category);
  const isWebApp = category === 'web';

  // サムネイルドロップ
  const { getRootProps: getThumbnailProps, getInputProps: getThumbnailInputProps } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
    onDrop: (accepted) => {
      if (accepted[0]) {
        setThumbnail(accepted[0]);
        setThumbnailPreview(URL.createObjectURL(accepted[0]));
      }
    },
    onDropRejected: () => toast.error('サムネイルは5MB以内のJPG/PNG/WEBPのみ'),
  });

  // アプリファイルドロップ
  const { getRootProps: getFileProps, getInputProps: getFileInputProps, isDragActive } = useDropzone({
    accept: selectedCategory?.ext
      ? Object.fromEntries(
          selectedCategory.ext.map(ext => [
            ext === '.exe' || ext === '.msi' ? 'application/octet-stream' :
            ext === '.apk' ? 'application/vnd.android.package-archive' :
            ext === '.zip' ? 'application/zip' :
            ext === '.dmg' ? 'application/x-apple-diskimage' :
            'application/octet-stream',
            [ext]
          ])
        )
      : undefined,
    maxSize: 500 * 1024 * 1024,
    maxFiles: 1,
    onDrop: (accepted) => { if (accepted[0]) setAppFile(accepted[0]); },
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

    if (!title || !description || !category) {
      toast.error('タイトル・説明・カテゴリは必須です');
      return;
    }
    if (!thumbnail) {
      toast.error('サムネイル画像は必須です');
      return;
    }
    if (!isWebApp && !appFile) {
      toast.error('アプリファイルをアップロードしてください');
      return;
    }
    if (isWebApp && !webUrl) {
      toast.error('Webアプリ URLを入力してください');
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('long_description', longDescription);
      fd.append('category', category);
      fd.append('tags', JSON.stringify(tags));
      fd.append('ai_tools', JSON.stringify(selectedAiTools));
      fd.append('web_url', webUrl);
      fd.append('github_url', githubUrl);
      fd.append('version', version);
      fd.append('thumbnail', thumbnail);
      if (appFile) fd.append('file', appFile);

      setProgress(30);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      setProgress(80);
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? 'アップロードに失敗しました');
        return;
      }

      setProgress(100);
      toast.success('アプリを公開しました！');
      router.push(`/apps/${json.app.id}`);
    } catch {
      toast.error('エラーが発生しました');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* プログレスバー */}
      {uploading && (
        <div className="rounded-full h-2 bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[color:var(--purple)] to-[color:var(--cyan)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* タイトル */}
      <div className="space-y-2">
        <Label htmlFor="title">タイトル <span className="text-destructive">*</span></Label>
        <Input
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="My Awesome AI App"
          required
        />
      </div>

      {/* カテゴリ */}
      <div className="space-y-2">
        <Label>カテゴリ <span className="text-destructive">*</span></Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all',
                category === cat.id
                  ? 'bg-[color:var(--purple)] border-[color:var(--purple)] text-white'
                  : 'border-border/50 text-muted-foreground hover:border-[color:var(--purple)]/50'
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
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
          placeholder="アプリの概要を入力..."
          rows={3}
          required
        />
      </div>

      {/* 詳細説明 Markdown */}
      <div className="space-y-2">
        <Label htmlFor="long_description">
          詳細説明 <span className="text-xs text-muted-foreground">（Markdown対応）</span>
        </Label>
        <Textarea
          id="long_description"
          value={longDescription}
          onChange={e => setLongDescription(e.target.value)}
          placeholder="## 機能&#10;&#10;- 機能1&#10;- 機能2"
          rows={8}
          className="font-mono text-sm"
        />
      </div>

      {/* サムネイル */}
      <div className="space-y-2">
        <Label>サムネイル <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground">（最大5MB, JPG/PNG/WEBP）</span></Label>
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
              <Image src={thumbnailPreview} alt="preview" fill className="object-cover rounded-xl" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setThumbnail(null); setThumbnailPreview(null); }}
                className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <p className="text-sm">クリックまたはドラッグ&ドロップ</p>
              <p className="text-xs">16:9 推奨</p>
            </div>
          )}
        </div>
      </div>

      {/* ファイル / URL */}
      {category && (
        <div className="space-y-2">
          {isWebApp ? (
            <>
              <Label htmlFor="web_url">Webアプリ URL <span className="text-destructive">*</span></Label>
              <Input
                id="web_url"
                type="url"
                value={webUrl}
                onChange={e => setWebUrl(e.target.value)}
                placeholder="https://your-app.vercel.app"
              />
            </>
          ) : (
            <>
              <Label>アプリファイル <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground">（最大500MB）</span></Label>
              <div
                {...getFileProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all text-center',
                  isDragActive ? 'border-[color:var(--purple)] bg-[color:var(--purple)]/5' : 'border-border/50 hover:border-[color:var(--purple)]/50',
                  appFile && 'border-[color:var(--purple)]/50 bg-[color:var(--purple)]/5'
                )}
              >
                <input {...getFileInputProps()} />
                {appFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <File className="h-6 w-6 text-[color:var(--purple)]" />
                    <div>
                      <p className="font-medium text-sm">{appFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(appFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setAppFile(null); }}
                      className="p-1 rounded-full hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <p className="text-sm">クリックまたはドラッグ&ドロップ</p>
                    {selectedCategory?.ext && (
                      <p className="text-xs">{selectedCategory.ext.join(' / ')} など</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 使ったAIツール */}
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
          <Button type="button" variant="outline" onClick={addTag} disabled={tags.length >= 5}>
            追加
          </Button>
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

      {/* GitHub URL & Version */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="github_url">GitHub URL <span className="text-xs text-muted-foreground">（任意）</span></Label>
          <Input
            id="github_url"
            type="url"
            value={githubUrl}
            onChange={e => setGithubUrl(e.target.value)}
            placeholder="https://github.com/..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="version">バージョン</Label>
          <Input
            id="version"
            value={version}
            onChange={e => setVersion(e.target.value)}
            placeholder="1.0.0"
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2 bg-[color:var(--purple)] hover:opacity-90 text-white"
        disabled={uploading}
      >
        <Upload className="h-5 w-5" />
        {uploading ? `アップロード中... ${progress}%` : 'アプリを公開する'}
      </Button>
    </form>
  );
}
