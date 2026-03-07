export const CATEGORIES = [
  { id: 'windows', label: 'Windows', icon: '🪟', iconUrl: 'https://cdn.simpleicons.org/windows/0078D6', ext: ['.exe', '.msi', '.zip'] },
  { id: 'mac',     label: 'Mac',     icon: '🍎', iconUrl: 'https://cdn.simpleicons.org/apple/ffffff',   ext: ['.dmg', '.pkg', '.zip'] },
  { id: 'android', label: 'Android', icon: '🤖', iconUrl: 'https://cdn.simpleicons.org/android/3DDC84', ext: ['.apk'] },
  { id: 'web',     label: 'Webアプリ', icon: '🌐', iconUrl: 'https://cdn.simpleicons.org/googlechrome/4285F4', ext: [] },
  { id: 'game',    label: 'ゲーム',   icon: '🎮', iconUrl: 'https://cdn.simpleicons.org/steam/ffffff',  ext: ['.exe', '.zip', '.apk'] },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

export const AI_TOOLS = [
  'Claude', 'ChatGPT', 'Cursor', 'GitHub Copilot', 'Gemini',
  'Bolt', 'v0', 'Replit', 'Windsurf', 'その他',
] as const;

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  github_url: string | null;
  created_at: string;
}

export interface App {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  long_description: string | null;
  category: CategoryId;
  tags: string[] | null;
  ai_tools: string[] | null;
  thumbnail_url: string | null;
  file_url: string | null;
  file_size: number | null;
  file_name: string | null;
  web_url: string | null;
  github_url: string | null;
  version: string;
  download_count: number;
  like_count: number;
  is_free: boolean;
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Like {
  user_id: string;
  app_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  app_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}
