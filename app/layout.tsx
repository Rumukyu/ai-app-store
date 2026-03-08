import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = 'https://appstore-sage.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'AIAppStore — AIで作ったアプリをシェアしよう',
    template: '%s | AIAppStore',
  },
  description: 'Claude・ChatGPT・CursorなどのAIツールで作ったアプリを公開・共有・ダウンロードできるプラットフォーム。AIで作ったアプリをシェアしよう。',
  keywords: ['AIアプリ', 'Claude', 'ChatGPT', 'Cursor', 'AIツール', 'アプリ配布', 'フリーウェア'],
  authors: [{ name: 'AIAppStore' }],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: siteUrl,
    siteName: 'AIAppStore',
    title: 'AIAppStore — AIで作ったアプリをシェアしよう',
    description: 'Claude・ChatGPT・CursorなどのAIツールで作ったアプリを公開・共有・ダウンロードできるプラットフォーム',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AIAppStore' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIAppStore — AIで作ったアプリをシェアしよう',
    description: 'Claude・ChatGPT・CursorなどのAIツールで作ったアプリを公開・共有・ダウンロードできるプラットフォーム',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: siteUrl },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <Navbar />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
