'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';

export default function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setStatus('error');
      setMessage('Invalid checkout session');
      return;
    }

    verifyPayment(sessionId);
  }, [searchParams]);

const verifyPayment = async (sessionId: string) => {
  try {
    const res = await fetch('/api/payments/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    const data = await res.json();
    
    // Успіх якщо 200 (навіть якщо вже enrolled)
    if (res.ok) {
      setStatus('success');
      setMessage(data.message || 'Payment successful! You are now enrolled in the course.');
    } else {
      setStatus('error');
      setMessage(data.error || 'Payment verification failed');
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    setStatus('error');
    setMessage('Failed to verify payment');
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-8">{message}</p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="primary"
                size="lg"
                className="w-full"
              >
                Go to My Courses
              </Button>
              <Button
                onClick={() => router.push('/courses')}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Browse More Courses
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-8">{message}</p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/courses')}
                variant="primary"
                size="lg"
                className="w-full"
              >
                Back to Courses
              </Button>
              {session && (
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
