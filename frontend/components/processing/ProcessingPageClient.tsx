'use client';

import { useRouter } from 'next/navigation';
import { useUploadStore } from '@/store/uploadStore';
import { ProcessingView } from '@/components/editor/ProcessingView';
import { useEffect } from 'react';

export default function ProcessingPageClient() {
  const router = useRouter();
  const { videoId } = useUploadStore();

  useEffect(() => {
    if (!videoId) {
      router.push('/upload');
    }
  }, [videoId, router]);

  if (!videoId) {
    return <div className="max-w-2xl mx-auto px-4 py-12">Redirecting...</div>;
  }

  return (
    <ProcessingView videoId={videoId} />
  );
}
