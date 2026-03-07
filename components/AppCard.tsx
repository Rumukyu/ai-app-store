import Link from 'next/link';
import Image from 'next/image';
import { Download, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CATEGORIES } from '@/lib/types';
import type { App } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

interface AppCardProps {
  app: App;
}

export default function AppCard({ app }: AppCardProps) {
  const category = CATEGORIES.find(c => c.id === app.category);

  return (
    <Link href={`/apps/${app.id}`}>
      <div className="group rounded-xl border border-border/50 bg-card overflow-hidden hover:border-[color:var(--purple)]/50 transition-all duration-200 hover:shadow-lg hover:shadow-[color:var(--purple)]/10">
        {/* サムネイル 16:9 */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          {app.thumbnail_url ? (
            <Image
              src={app.thumbnail_url}
              alt={app.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {category?.iconUrl
                ? <img src={category.iconUrl} alt={category.label} className="w-12 h-12 opacity-60" />
                : <span className="text-4xl">📦</span>
              }
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              className="text-xs bg-background/80 backdrop-blur-sm flex items-center gap-1"
            >
              {category?.iconUrl
                ? <img src={category.iconUrl} alt="" className="w-3 h-3 inline" />
                : category?.icon
              }
              {category?.label}
            </Badge>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-4">
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-[color:var(--purple)] transition-colors">
            {app.title}
          </h3>

          {app.profiles?.username && (
            <p className="text-xs text-muted-foreground mt-0.5">
              by {app.profiles.display_name ?? app.profiles.username}
            </p>
          )}

          {app.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {app.description}
            </p>
          )}

          {/* AI Tools */}
          {app.ai_tools && app.ai_tools.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {app.ai_tools.slice(0, 3).map(tool => (
                <Badge
                  key={tool}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-[color:var(--cyan)]/30 text-[color:var(--cyan)]"
                >
                  {tool}
                </Badge>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {app.download_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {app.like_count.toLocaleString()}
            </span>
            {app.file_size && (
              <span>{formatBytes(app.file_size)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
