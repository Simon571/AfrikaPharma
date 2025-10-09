type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  userId?: string;
  action?: string;
  resource?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };
    
    // Console logging (toujours)
    const consoleMethod = level === 'error' ? console.error : 
                         level === 'warn' ? console.warn : console.log;
    
    if (this.isDevelopment) {
      consoleMethod(`[${timestamp}] [${level.toUpperCase()}] ${message}`, context || '');
    } else {
      consoleMethod(JSON.stringify(logEntry));
    }
    
    // En production, vous pourriez envoyer à un service de logging
    if (!this.isDevelopment && (level === 'error' || level === 'warn')) {
      this.sendToLoggingService(logEntry);
    }
  }
  
  private async sendToLoggingService(logEntry: any) {
    try {
      // Exemple d'envoi vers un service de logging externe
      // await fetch('https://your-logging-service.com/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry),
      // });
    } catch (error) {
      console.error('Erreur lors de l\'envoi des logs:', error);
    }
  }
  
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }
  
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }
  
  error(message: string, context?: LogContext & { error?: Error }) {
    const errorContext = context?.error ? {
      ...context,
      errorMessage: context.error.message,
      errorStack: context.error.stack,
    } : context;
    
    this.log('error', message, errorContext);
  }
  
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }
  
  // Logs spécifiques à l'application
  userAction(action: string, userId: string, resource?: string, metadata?: Record<string, any>) {
    this.info(`Action utilisateur: ${action}`, {
      userId,
      action,
      resource,
      metadata,
    });
  }
  
  apiRequest(method: string, path: string, userId?: string, duration?: number) {
    this.info(`${method} ${path}`, {
      userId,
      action: 'api_request',
      resource: path,
      metadata: { method, duration },
    });
  }
  
  securityEvent(event: string, userId?: string, details?: Record<string, any>) {
    this.warn(`Événement de sécurité: ${event}`, {
      userId,
      action: 'security_event',
      metadata: details,
    });
  }
}

export const logger = new Logger();

// Middleware pour logger les requêtes API
export function createApiLogger(route: string) {
  return {
    start: () => Date.now(),
    end: (startTime: number, userId?: string, method?: string) => {
      const duration = Date.now() - startTime;
      logger.apiRequest(method || 'UNKNOWN', route, userId, duration);
    },
  };
}