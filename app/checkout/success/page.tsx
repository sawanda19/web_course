'use client';

import { Suspense } from 'react';
import CheckoutSuccessContent from './CheckoutSuccessContent';

// This prevents prerendering
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
