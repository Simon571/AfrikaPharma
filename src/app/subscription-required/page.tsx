'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AccessBlockedPage } from '@/components/trial/AccessBlocked';

function SubscriptionRequiredContent() {
  const searchParams = useSearchParams();
  const feature = searchParams.get('feature') || 'cette fonctionnalité';
  const reason = (searchParams.get('reason') as 'trial_expired' | 'premium_required') || 'trial_expired';

  return (
    <AccessBlockedPage
      title="Abonnement requis"
      feature={feature}
      reason={reason}
    />
  );
}

export default function SubscriptionRequiredPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SubscriptionRequiredContent />
    </Suspense>
  );
}