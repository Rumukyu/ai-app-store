'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CATEGORIES } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') ?? 'all';

  const handleChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId === 'all') {
      params.delete('category');
    } else {
      params.set('category', categoryId);
    }
    params.delete('page');
    router.push(`/apps?${params.toString()}`);
  };

  const tabs = [{ id: 'all', label: '全て', icon: '✨', iconUrl: null }, ...CATEGORIES];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => handleChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border',
            currentCategory === tab.id
              ? 'bg-[color:var(--purple)] border-[color:var(--purple)] text-white'
              : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-[color:var(--purple)]/50'
          )}
        >
          {'iconUrl' in tab && tab.iconUrl
            ? <img src={tab.iconUrl} alt="" className="w-4 h-4" />
            : <span>{tab.icon}</span>
          }
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
