'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AccessBlockedPage } from '@/components/trial/AccessBlocked';

function TrialLimitedContent() {
  const searchParams = useSearchParams();
  const feature = searchParams.get('feature') || 'cette fonctionnalité';
  const daysRemaining = parseInt(searchParams.get('daysRemaining') || '0');

  return (
    <AccessBlockedPage
      title="Version d'essai limitée"
      feature={feature}
      reason="premium_required"
      trialStatus={{
        daysRemaining,
        subscriptionType: 'trial'
      }}
    />
  );
}

export default function TrialLimitedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <TrialLimitedContent />
    </Suspense>
  );
}