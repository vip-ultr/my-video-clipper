import { Suspense } from 'react';
import ProcessingPageClient from '@/components/processing/ProcessingPageClient';

export default function ProcessingPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-12">Loading...</div>}>
      <ProcessingPageClient />
    </Suspense>
  );
}
