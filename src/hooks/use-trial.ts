'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  totalDays: number;
  subscriptionType: 'trial' | 'premium' | 'expired';
  features: Record<string, boolean>;
}

interface UseTrialReturn {
  trialStatus: TrialStatus | null;
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
  checkFeatureAccess: (feature: string) => Promise<boolean>;
  refreshStatus: () => void;
}

/**
 * Hook principal pour la gestion des périodes d'essai
 */
export function useTrial(): UseTrialReturn {
  const { data: session, status: sessionStatus } = useSession();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [hasAccess, setHasAccess] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrialStatus = async () => {
    if (sessionStatus === 'loading') return;
    
    if (!session) {
      setLoading(false);
      setHasAccess(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/trial/status');
      const data = await response.json();

      if (response.ok) {
        setTrialStatus(data.status);
        setHasAccess(data.hasAccess);
      } else {
        setError(data.error || 'Erreur lors de la vérification du statut');
        setHasAccess(false);
      }
    } catch (err) {
      setError('Erreur de connexion');
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const checkFeatureAccess = async (feature: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/trial/check-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feature }),
      });

      const data = await response.json();
      return data.hasAccess || false;
    } catch (err) {
      console.error('Erreur lors de la vérification d\'accès:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchTrialStatus();
  }, [session, sessionStatus]);

  return {
    trialStatus,
    hasAccess,
    loading,
    error,
    checkFeatureAccess,
    refreshStatus: fetchTrialStatus,
  };
}

/**
 * Hook pour vérifier l'accès à une fonctionnalité spécifique
 */
export function useFeatureAccess(featureName: string) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const checkAccess = async () => {
      if (!session) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/trial/check-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ feature: featureName }),
        });

        const data = await response.json();
        setHasAccess(data.hasAccess);
        
        if (!data.hasAccess) {
          setError(data.message || 'Accès non autorisé');
        }
      } catch (err) {
        setError('Erreur lors de la vérification d\'accès');
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    if (featureName) {
      checkAccess();
    }
  }, [featureName, session]);

  return { hasAccess, loading, error };
}

/**
 * Composant HOC pour protéger les composants avec vérification d'accès
 */
export function withTrialProtection<P extends object>(
  Component: React.ComponentType<P>,
  featureName: string,
  fallbackComponent?: React.ComponentType<{ reason: string }>
) {
  return function ProtectedComponent(props: P) {
    const { hasAccess, loading, error } = useFeatureAccess(featureName);

    if (loading) {
      return React.createElement(
        'div',
        { className: 'flex items-center justify-center p-8' },
        React.createElement('div', {
          className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
        })
      );
    }

    if (!hasAccess) {
      const FallbackComponent = fallbackComponent;
      if (FallbackComponent) {
        return React.createElement(FallbackComponent, { reason: error || 'Accès non autorisé' });
      }
      
      return React.createElement(
        'div',
        { className: 'text-center p-8' },
        React.createElement(
          'h3',
          { className: 'text-lg font-medium text-gray-900 mb-2' },
          'Accès restreint'
        ),
        React.createElement(
          'p',
          { className: 'text-gray-600' },
          error || 'Vous n\'avez pas accès à cette fonctionnalité.'
        )
      );
    }

    return React.createElement(Component, props);
  };
}

/**
 * Hook utilitaire pour obtenir des informations formatées sur l'essai
 */
export function useTrialDisplay() {
  const { trialStatus, hasAccess, loading } = useTrial();

  const getDisplayText = () => {
    if (loading) return 'Vérification...';
    if (!trialStatus) return 'Statut indisponible';

    switch (trialStatus.subscriptionType) {
      case 'premium':
        return 'Premium';
      case 'expired':
        return 'Essai expiré';
      case 'trial':
        return `${trialStatus.daysRemaining} jour${trialStatus.daysRemaining > 1 ? 's' : ''} restant${trialStatus.daysRemaining > 1 ? 's' : ''}`;
      default:
        return 'Statut inconnu';
    }
  };

  const getBadgeColor = () => {
    if (!trialStatus) return 'bg-gray-500';

    switch (trialStatus.subscriptionType) {
      case 'premium':
        return 'bg-green-500';
      case 'expired':
        return 'bg-red-500';
      case 'trial':
        return trialStatus.daysRemaining <= 7 ? 'bg-orange-500' : 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getProgressPercentage = () => {
    if (!trialStatus) return 0;
    return ((trialStatus.totalDays - trialStatus.daysRemaining) / trialStatus.totalDays) * 100;
  };

  return {
    trialStatus,
    hasAccess,
    loading,
    displayText: getDisplayText(),
    badgeColor: getBadgeColor(),
    progressPercentage: getProgressPercentage(),
  };
}