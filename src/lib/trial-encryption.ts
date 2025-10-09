import crypto from 'crypto';

// Clé de chiffrement sécurisée (doit être en variable d'environnement)
const ENCRYPTION_KEY = process.env.TRIAL_ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';

/**
 * Interface pour les données d'essai chiffrées
 */
export interface TrialData {
  startDate: string;
  endDate: string;
  daysUsed: number;
  lastAccess: string;
  features: string[];
  userId: string;
  checksum: string; // Pour vérifier l'intégrité
}

/**
 * Chiffre les données d'essai de manière sécurisée
 */
export function encryptTrialData(data: TrialData): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    
    // Ajouter un timestamp et un checksum pour la sécurité
    const secureData = {
      ...data,
      timestamp: new Date().toISOString(),
      checksum: generateChecksum(data)
    };
    
    const text = JSON.stringify(secureData);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combiner IV + authTag + données chiffrées
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Erreur de chiffrement:', error);
    throw new Error('Échec du chiffrement des données d\'essai');
  }
}

/**
 * Déchiffre les données d'essai
 */
export function decryptTrialData(encryptedData: string): TrialData | null {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Format de données chiffrées invalide');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const data = JSON.parse(decrypted);
    
    // Vérifier l'intégrité des données
    if (!verifyChecksum(data)) {
      throw new Error('Données corrompues détectées');
    }
    
    return data as TrialData;
  } catch (error) {
    console.error('Erreur de déchiffrement:', error);
    return null;
  }
}

/**
 * Génère un checksum pour vérifier l'intégrité
 */
function generateChecksum(data: TrialData): string {
  const dataStr = `${data.userId}-${data.startDate}-${data.endDate}-${data.daysUsed}`;
  return crypto.createHash('sha256').update(dataStr).digest('hex');
}

/**
 * Vérifie le checksum des données
 */
function verifyChecksum(data: any): boolean {
  const expectedChecksum = generateChecksum({
    userId: data.userId,
    startDate: data.startDate,
    endDate: data.endDate,
    daysUsed: data.daysUsed,
    lastAccess: data.lastAccess,
    features: data.features,
    checksum: data.checksum
  });
  
  return data.checksum === expectedChecksum;
}

/**
 * Génère une clé de chiffrement sécurisée
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hache une valeur de manière sécurisée (pour les identifiants)
 */
export function secureHash(value: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(value, actualSalt, 100000, 64, 'sha512');
  return `${actualSalt}:${hash.toString('hex')}`;
}

/**
 * Vérifie un hash sécurisé
 */
export function verifySecureHash(value: string, hash: string): boolean {
  const [salt, originalHash] = hash.split(':');
  const verifyHash = crypto.pbkdf2Sync(value, salt, 100000, 64, 'sha512');
  return originalHash === verifyHash.toString('hex');
}