/**
 * Environment Configuration
 * Manages different settings for dev, UAT, and production
 */

export type Environment = 'development' | 'uat' | 'production';

/**
 * Get current environment
 * Automatically determined by build configuration
 */
export function getCurrentEnvironment(): Environment {
  // In development mode
  if (__DEV__) {
    return 'development';
  }
  
  // For production/UAT, use environment variable
  // This can be set during build time
  const buildEnv = process.env.EXPO_PUBLIC_ENV as Environment | undefined;
  
  if (buildEnv === 'uat') {
    return 'uat';
  }
  
  return 'production';
}

/**
 * Environment-specific configuration
 */
interface EnvConfig {
  name: string;
  apiUrl?: string;
  githubRepo?: string;
  githubToken?: string;
  enableRemoteSync: boolean;
  enableCreditCards: boolean;
  showDebugInfo: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  cacheTTL: number; // in milliseconds
}

const configs: Record<Environment, EnvConfig> = {
  development: {
    name: 'Development',
    githubRepo: 'tazhiman/scrimp-rewards-data',
    githubToken: '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',
    enableRemoteSync: true,
    enableCreditCards: true,
    showDebugInfo: true,
    logLevel: 'debug',
    cacheTTL: 0, // Always fetch fresh in dev
  },
  
  uat: {
    name: 'UAT',
    githubRepo: 'tazhiman/scrimp-rewards-data',
    githubToken: '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',
    enableRemoteSync: true,
    enableCreditCards: true,
    showDebugInfo: true, // Keep debug visible for testers
    logLevel: 'info',
    cacheTTL: 1 * 60 * 60 * 1000, // 1 hour for UAT
  },
  
  production: {
    name: 'Production',
    enableRemoteSync: false,
    enableCreditCards: false,
    showDebugInfo: false, // Never show debug in production
    logLevel: 'error',
    cacheTTL: 0,
  },
};

/**
 * Get configuration for current environment
 */
export function getEnvConfig(): EnvConfig {
  const env = getCurrentEnvironment();
  return configs[env];
}

/**
 * Convenience getters
 */
export const ENV = {
  get current(): Environment {
    return getCurrentEnvironment();
  },
  
  get config(): EnvConfig {
    return getEnvConfig();
  },
  
  get isDevelopment(): boolean {
    return getCurrentEnvironment() === 'development';
  },
  
  get isUAT(): boolean {
    return getCurrentEnvironment() === 'uat';
  },
  
  get isProduction(): boolean {
    return getCurrentEnvironment() === 'production';
  },
  
  get showDebugFeatures(): boolean {
    return this.config.showDebugInfo;
  },

  get enableCreditCards(): boolean {
    return this.config.enableCreditCards;
  },
};
