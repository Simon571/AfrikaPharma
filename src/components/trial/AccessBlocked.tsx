'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Lock, 
  Crown, 
  AlertTriangle, 
  Zap,
  ArrowRight 
} from 'lucide-react';

interface AccessBlockedProps {
  feature: string;
  reason: 'trial_expired' | 'premium_required' | 'admin_required';
  trialStatus?: {
    daysRemaining: number;
    subscriptionType: string;
  };
  className?: string;
  showUpgradeButton?: boolean;
}

export function AccessBlocked({ 
  feature, 
  reason, 
  trialStatus, 
  className = '',
  showUpgradeButton = true 
}: AccessBlockedProps) {
  
  const getReasonConfig = () => {
    switch (reason) {
      case 'trial_expired':
        return {
          icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
          title: 'Période d\'essai expirée',
          description: `Votre période d'essai gratuite a expiré. Pour continuer à utiliser ${feature}, passez à un abonnement Premium.`,
          color: 'border-red-200 bg-red-50',
          buttonText: 'Passer à Premium',
          buttonVariant: 'default' as const
        };
      case 'premium_required':
        return {
          icon: <Crown className="h-8 w-8 text-amber-500" />,
          title: 'Fonctionnalité Premium',
          description: `${feature} est disponible uniquement avec un abonnement Premium. Découvrez toutes les fonctionnalités avancées.`,
          color: 'border-amber-200 bg-amber-50',
          buttonText: 'Découvrir Premium',
          buttonVariant: 'default' as const
        };
      case 'admin_required':
        return {
          icon: <Lock className="h-8 w-8 text-gray-500" />,
          title: 'Accès administrateur requis',
          description: `${feature} nécessite des privilèges administrateur. Contactez votre administrateur système.`,
          color: 'border-gray-200 bg-gray-50',
          buttonText: 'Contacter l\'admin',
          buttonVariant: 'outline' as const
        };
    }
  };

  const config = getReasonConfig();

  const handleUpgrade = () => {
    if (reason === 'admin_required') {
      // Ouvrir un client email ou afficher les informations de contact
      window.location.href = 'mailto:admin@yourcompany.com?subject=Demande d\'accès administrateur';
    } else {
      // Rediriger vers la page d'abonnement
      window.open('/subscription', '_blank');
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <Card className={`max-w-md w-full ${config.color}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {config.icon}
          </div>
          <CardTitle className="text-xl font-semibold">
            {config.title}
          </CardTitle>
          <CardDescription className="text-center">
            {config.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Affichage du statut d'essai si disponible */}
          {trialStatus && reason !== 'admin_required' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-medium text-blue-900">Statut de votre compte</h4>
              <p className="text-blue-700 text-sm">
                {reason === 'trial_expired' 
                  ? 'Votre période d\'essai gratuite de 30 jours est terminée.'
                  : `Il vous reste ${trialStatus.daysRemaining} jour(s) d'essai.`
                }
              </p>
            </div>
          )}

          {/* Avantages du Premium */}
          {reason !== 'admin_required' && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Avec Premium, accédez à :</h4>
              <ul className="text-xs space-y-1 text-gray-600">
                <li className="flex items-center space-x-2">
                  <ArrowRight className="h-3 w-3" />
                  <span>Gestion avancée des utilisateurs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ArrowRight className="h-3 w-3" />
                  <span>Rapports détaillés et analyses</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ArrowRight className="h-3 w-3" />
                  <span>Export de données illimité</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ArrowRight className="h-3 w-3" />
                  <span>Support prioritaire</span>
                </li>
              </ul>
            </div>
          )}

          {/* Boutons d'action */}
          {showUpgradeButton && (
            <div className="space-y-2">
              <Button 
                className="w-full"
                variant={config.buttonVariant}
                onClick={handleUpgrade}
              >
                {reason !== 'admin_required' && <Zap className="h-4 w-4 mr-2" />}
                {config.buttonText}
              </Button>
              
              {reason !== 'admin_required' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.history.back()}
                >
                  Retourner en arrière
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Composant pour les pages entières bloquées
 */
interface AccessBlockedPageProps extends AccessBlockedProps {
  title?: string;
}

export function AccessBlockedPage({ 
  title = "Accès restreint",
  ...props 
}: AccessBlockedPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          {title}
        </h1>
        <AccessBlocked {...props} />
      </div>
    </div>
  );
}

/**
 * Hook pour vérifier l'accès côté client
 */
export function useFeatureAccess(featureName: string) {
  const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const checkAccess = async () => {
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
  }, [featureName]);

  return { hasAccess, loading, error };
}