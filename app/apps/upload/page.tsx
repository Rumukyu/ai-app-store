import UploadForm from '@/components/UploadForm';

export const metadata = {
  title: 'アプリをアップロード — AIAppStore',
};

export default function UploadPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">アプリをアップロード</h1>
          <p className="text-muted-foreground mt-2">
            AIで作ったアプリをみんなとシェアしよう
          </p>
        </div>
        <UploadForm />
      </div>
    </div>
  );
}
