import { prisma } from '@/lib/prisma';
import { TrialData, encryptTrialData, decryptTrialData } from '@/lib/trial-encryption';

export interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  totalDays: number;
  startDate: Date;
  endDate: Date;
  subscriptionType: 'trial' | 'premium' | 'expired';
  canExtend: boolean;
  extensionsUsed: number;
  maxExtensions: number;
  blockedFeatures: string[];
}

export interface TrialCheckResult {
  status: TrialStatus;
  hasAccess: boolean;
  message?: string;
  actionRequired?: 'subscribe' | 'renew' | 'contact_support';
}

/**
 * Service principal de gestion des périodes d'essai
 */
export class TrialService {
  
  /**
   * Initialise une nouvelle période d'essai pour un utilisateur
   */
  static async initializeTrial(userId: string, trialDays: number = 30): Promise<TrialStatus> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + trialDays);

    try {
      // Créer ou mettre à jour l'utilisateur
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          trialStartDate: startDate,
          trialEndDate: endDate,
          isTrialActive: true,
          subscriptionType: 'trial',
          trialDaysUsed: 0,
          lastTrialCheck: new Date(),
        }
      });

      // Créer l'enregistrement de gestion d'essai
      const trialManagement = await prisma.trialManagement.upsert({
        where: { userId },
        update: {
          trialDuration: trialDays,
          remainingDays: trialDays,
          extensionsGranted: 0,
          isBlocked: false,
          updatedAt: new Date()
        },
        create: {
          userId,
          trialDuration: trialDays,
          remainingDays: trialDays,
          premiumFeatures: {
            inventory: true,
            sales: true,
            reports: true,
            users: false // Limité en version d'essai
          }
        }
      });

      // Chiffrer les données sensibles
      const trialData: TrialData = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        daysUsed: 0,
        lastAccess: new Date().toISOString(),
        features: ['inventory', 'sales', 'reports'],
        userId,
        checksum: ''
      };

      const encryptedData = encryptTrialData(trialData);
      
      await prisma.user.update({
        where: { id: userId },
        data: { encryptedTrialData: encryptedData }
      });

      // Enregistrer dans l'audit
      await this.logTrialAction(userId, 'initialize', null, 'trial', trialDays);

      return this.formatTrialStatus(user, trialManagement);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'essai:', error);
      throw new Error('Impossible d\'initialiser la période d\'essai');
    }
  }

  /**
   * Vérifie le statut actuel de la période d'essai
   */
  static async checkTrialStatus(userId: string, forceUpdate = false): Promise<TrialCheckResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { trialManagement: true }
      });

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Si l'utilisateur n'a pas d'essai, l'initialiser
      if (!user.trialStartDate && user.subscriptionType === 'trial') {
        const status = await this.initializeTrial(userId);
        return {
          status,
          hasAccess: true,
          message: 'Période d\'essai initialisée avec succès'
        };
      }

      const now = new Date();
      const lastCheck = user.lastTrialCheck || new Date(0);
      const timeSinceLastCheck = now.getTime() - lastCheck.getTime();
      
      // Vérifier seulement si plus de 1 heure s'est écoulée ou si forcé
      if (timeSinceLastCheck < 3600000 && !forceUpdate && user.subscriptionType !== 'expired') {
        return this.getCachedTrialStatus(user);
      }

      // Calculer les jours restants
      const trialEndDate = user.trialEndDate || new Date();
      const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const daysUsed = Math.max(0, (user.trialManagement?.trialDuration || 30) - daysRemaining);

      // Vérifier si l'essai a expiré
      const isExpired = daysRemaining <= 0;
      const newSubscriptionType = isExpired ? 'expired' : user.subscriptionType;
      const isTrialActive = !isExpired && user.subscriptionType === 'trial';

      // Mettre à jour les données
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isTrialActive,
          subscriptionType: newSubscriptionType,
          trialDaysUsed: daysUsed,
          lastTrialCheck: now
        }
      });

      if (user.trialManagement) {
        await prisma.trialManagement.update({
          where: { userId },
          data: {
            remainingDays: Math.max(0, daysRemaining),
            updatedAt: now
          }
        });
      }

      // Enregistrer dans l'audit si changement de statut
      if (user.subscriptionType !== newSubscriptionType) {
        await this.logTrialAction(
          userId, 
          isExpired ? 'expire' : 'check', 
          user.subscriptionType, 
          newSubscriptionType,
          daysRemaining
        );
      }

      const status = await this.getTrialStatus(userId);
      
      return {
        status,
        hasAccess: !isExpired,
        message: isExpired ? 'Votre période d\'essai a expiré' : undefined,
        actionRequired: isExpired ? 'subscribe' : undefined
      };

    } catch (error) {
      console.error('Erreur lors de la vérification de l\'essai:', error);
      throw new Error('Impossible de vérifier le statut de l\'essai');
    }
  }

  /**
   * Prolonge la période d'essai
   */
  static async extendTrial(userId: string, additionalDays: number): Promise<TrialStatus> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { trialManagement: true }
      });

      if (!user || !user.trialManagement) {
        throw new Error('Aucune période d\'essai trouvée pour cet utilisateur');
      }

      const { trialManagement } = user;
      
      // Vérifier si l'extension est autorisée
      if (trialManagement.extensionsGranted >= trialManagement.maxExtensions) {
        throw new Error('Nombre maximum d\'extensions atteint');
      }

      if (trialManagement.isBlocked) {
        throw new Error('Période d\'essai bloquée, impossible de prolonger');
      }

      const newEndDate = new Date(user.trialEndDate || new Date());
      newEndDate.setDate(newEndDate.getDate() + additionalDays);

      // Mettre à jour les données
      await prisma.user.update({
        where: { id: userId },
        data: {
          trialEndDate: newEndDate,
          isTrialActive: true,
          subscriptionType: 'trial',
          lastTrialCheck: new Date()
        }
      });

      await prisma.trialManagement.update({
        where: { userId },
        data: {
          extensionsGranted: trialManagement.extensionsGranted + 1,
          remainingDays: trialManagement.remainingDays + additionalDays,
          trialDuration: trialManagement.trialDuration + additionalDays,
          updatedAt: new Date()
        }
      });

      // Enregistrer dans l'audit
      await this.logTrialAction(userId, 'extend', 'trial', 'trial', additionalDays);

      return await this.getTrialStatus(userId);
    } catch (error) {
      console.error('Erreur lors de la prolongation:', error);
      throw error;
    }
  }

  /**
   * Récupère le statut détaillé de l'essai
   */
  static async getTrialStatus(userId: string): Promise<TrialStatus> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { trialManagement: true }
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return this.formatTrialStatus(user, user.trialManagement);
  }

  /**
   * Vérifie l'accès à une fonctionnalité spécifique
   */
  static async hasFeatureAccess(userId: string, featureName: string): Promise<boolean> {
    try {
      const { hasAccess, status } = await this.checkTrialStatus(userId);
      
      if (!hasAccess) return false;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { trialManagement: true }
      });

      if (!user?.trialManagement) return false;

      const features = user.trialManagement.premiumFeatures as any;
      return features?.[featureName] === true;
    } catch (error) {
      console.error('Erreur lors de la vérification d\'accès:', error);
      return false;
    }
  }

  /**
   * Formate les données de statut
   */
  private static formatTrialStatus(user: any, trialManagement: any): TrialStatus {
    const now = new Date();
    const startDate = user.trialStartDate || now;
    const endDate = user.trialEndDate || now;
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    return {
      isActive: user.isTrialActive && user.subscriptionType === 'trial',
      daysRemaining,
      totalDays: trialManagement?.trialDuration || 30,
      startDate,
      endDate,
      subscriptionType: user.subscriptionType,
      canExtend: trialManagement ? 
        trialManagement.extensionsGranted < trialManagement.maxExtensions && !trialManagement.isBlocked : 
        false,
      extensionsUsed: trialManagement?.extensionsGranted || 0,
      maxExtensions: trialManagement?.maxExtensions || 2,
      blockedFeatures: this.getBlockedFeatures(user.subscriptionType, trialManagement)
    };
  }

  /**
   * Récupère le statut en cache
   */
  private static getCachedTrialStatus(user: any): TrialCheckResult {
    const isActive = user.isTrialActive && user.subscriptionType === 'trial';
    return {
      status: this.formatTrialStatus(user, user.trialManagement),
      hasAccess: isActive,
      message: !isActive ? 'Accès limité' : undefined
    };
  }

  /**
   * Détermine les fonctionnalités bloquées
   */
  private static getBlockedFeatures(subscriptionType: string, trialManagement: any): string[] {
    if (subscriptionType === 'premium') return [];
    
    const blocked = [];
    if (subscriptionType === 'expired') {
      blocked.push('sales', 'inventory', 'reports', 'users', 'export');
    } else if (subscriptionType === 'trial') {
      // En version d'essai, certaines fonctionnalités sont limitées
      blocked.push('users', 'advanced-reports', 'bulk-operations');
    }
    
    return blocked;
  }

  /**
   * Enregistre une action dans l'audit
   */
  private static async logTrialAction(
    userId: string, 
    action: string, 
    oldStatus: string | null, 
    newStatus: string,
    daysRemaining?: number
  ): Promise<void> {
    try {
      await prisma.trialAuditLog.create({
        data: {
          userId,
          action,
          oldStatus,
          newStatus,
          daysRemaining,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'trial-service'
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'audit:', error);
    }
  }
}