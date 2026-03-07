import AppCard from '@/components/AppCard';
import type { App } from '@/lib/types';

interface AppGridProps {
  apps: App[];
  emptyMessage?: string;
}

export default function AppGrid({ apps, emptyMessage = 'アプリが見つかりませんでした' }: AppGridProps) {
  if (apps.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {apps.map(app => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
