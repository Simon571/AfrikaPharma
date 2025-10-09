'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Clock, 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Zap
} from 'lucide-react';

interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  totalDays: number;
  daysUsed: number;
  startDate: string;
  endDate: string;
  subscriptionType: 'trial' | 'premium' | 'expired';
  canExtend: boolean;
  features: {
    inventory: boolean;
    sales: boolean;
    basicReports: boolean;
    userManagement: boolean;
    advancedReports: boolean;
    dataExport: boolean;
  };
}

interface TrialStatusWidgetProps {
  className?: string;
  showUpgrade?: boolean;
  compact?: boolean;
}

export function TrialStatusWidget({ 
  className = '', 
  showUpgrade = true, 
  compact = false 
}: TrialStatusWidgetProps) {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrialStatus();
  }, []);

  const fetchTrialStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trial/status');
      const data = await response.json();
      
      if (response.ok && data.status) {
        setTrialStatus(data.status);
      } else {
        setError(data.error || 'Erreur lors de la récupération du statut');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'premium': return 'bg-green-500';
      case 'trial': return 'bg-blue-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'premium': return <Star className="h-4 w-4" />;
      case 'trial': return <Clock className="h-4 w-4" />;
      case 'expired': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getProgressPercentage = () => {
    if (!trialStatus) return 0;
    return (trialStatus.daysUsed / trialStatus.totalDays) * 100;
  };

  if (loading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className={`border-red-200 border bg-red-50 p-3 rounded ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <h4 className="font-medium text-red-800">Erreur</h4>
        </div>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!trialStatus) return null;

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge 
          variant="secondary" 
          className={`${getStatusColor(trialStatus.subscriptionType)} text-white`}
        >
          {getStatusIcon(trialStatus.subscriptionType)}
          <span className="ml-1">
            {trialStatus.subscriptionType === 'premium' ? 'Premium' : 
             trialStatus.subscriptionType === 'expired' ? 'Expiré' :
             `${trialStatus.daysRemaining}j restants`}
          </span>
        </Badge>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(trialStatus.subscriptionType)}
            <CardTitle className="text-lg">
              {trialStatus.subscriptionType === 'premium' ? 'Abonnement Premium' :
               trialStatus.subscriptionType === 'expired' ? 'Période d\'essai expirée' :
               'Période d\'essai'}
            </CardTitle>
          </div>
          <Badge 
            variant="secondary" 
            className={`${getStatusColor(trialStatus.subscriptionType)} text-white`}
          >
            {trialStatus.subscriptionType === 'premium' ? 'Premium' : 
             trialStatus.subscriptionType === 'expired' ? 'Expiré' : 'Essai'}
          </Badge>
        </div>
        
        {trialStatus.subscriptionType !== 'premium' && (
          <CardDescription>
            {trialStatus.subscriptionType === 'expired' ? 
              'Votre période d\'essai a expiré. Passez à Premium pour continuer.' :
              `Il vous reste ${trialStatus.daysRemaining} jour${trialStatus.daysRemaining > 1 ? 's' : ''} d'essai gratuit.`
            }
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {trialStatus.subscriptionType !== 'premium' && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{trialStatus.daysUsed}/{trialStatus.totalDays} jours</span>
              </div>
              <Progress 
                value={getProgressPercentage()} 
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Début: {new Date(trialStatus.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>Fin: {new Date(trialStatus.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          </>
        )}

        {/* Fonctionnalités disponibles */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Fonctionnalités disponibles:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`flex items-center space-x-1 ${trialStatus.features.inventory ? 'text-green-600' : 'text-gray-400'}`}>
              <CheckCircle className="h-3 w-3" />
              <span>Gestion des stocks</span>
            </div>
            <div className={`flex items-center space-x-1 ${trialStatus.features.sales ? 'text-green-600' : 'text-gray-400'}`}>
              <CheckCircle className="h-3 w-3" />
              <span>Ventes</span>
            </div>
            <div className={`flex items-center space-x-1 ${trialStatus.features.basicReports ? 'text-green-600' : 'text-gray-400'}`}>
              <CheckCircle className="h-3 w-3" />
              <span>Rapports de base</span>
            </div>
            <div className={`flex items-center space-x-1 ${trialStatus.features.userManagement ? 'text-green-600' : 'text-gray-400'}`}>
              {trialStatus.features.userManagement ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              <span>Gestion utilisateurs</span>
            </div>
            <div className={`flex items-center space-x-1 ${trialStatus.features.advancedReports ? 'text-green-600' : 'text-gray-400'}`}>
              {trialStatus.features.advancedReports ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              <span>Rapports avancés</span>
            </div>
            <div className={`flex items-center space-x-1 ${trialStatus.features.dataExport ? 'text-green-600' : 'text-gray-400'}`}>
              {trialStatus.features.dataExport ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              <span>Export de données</span>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        {showUpgrade && trialStatus.subscriptionType !== 'premium' && (
          <div className="space-y-2">
            {trialStatus.subscriptionType === 'expired' ? (
              <div className="border-red-200 bg-red-50 border p-3 rounded">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <h4 className="text-red-800 font-medium">Accès limité</h4>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  Votre période d'essai a expiré. Passez à Premium pour retrouver toutes les fonctionnalités.
                </p>
              </div>
            ) : (
              trialStatus.daysRemaining <= 7 && (
                <div className="border-orange-200 bg-orange-50 border p-3 rounded">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <h4 className="text-orange-800 font-medium">Attention</h4>
                  </div>
                  <p className="text-orange-700 text-sm mt-1">
                    Votre essai expire bientôt. Pensez à passer à Premium pour continuer sans interruption.
                  </p>
                </div>
              )
            )}
            
            <div className="flex space-x-2">
              <Button 
                className="flex-1"
                onClick={() => window.open('/subscription', '_blank')}
              >
                <Zap className="h-4 w-4 mr-2" />
                Passer à Premium
              </Button>
              
              {trialStatus.canExtend && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    // TODO: Implémenter la demande d'extension
                    alert('Fonction d\'extension à implémenter');
                  }}
                >
                  Prolonger l'essai
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}