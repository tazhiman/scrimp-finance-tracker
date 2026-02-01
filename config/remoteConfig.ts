/**
 * Remote Data Configuration
 * 
 * Now uses environment-based configuration from config/env.ts
 * Settings automatically adjust based on dev/UAT/production environment
 */

import { ENV } from './env';

export const REMOTE_CONFIG = {
  // Automatically enabled/disabled based on environment
  get ENABLED(): boolean {
    return ENV.config.enableRemoteSync;
  },
  
  // GitHub repository from environment config
  get GITHUB_REPO(): string {
    return ENV.config.githubRepo || '';
  },
  
  // GitHub token from environment config
  get GITHUB_TOKEN(): string {
    return ENV.config.githubToken || '';
  },
  
  // Cache TTL automatically set per environment
  // Dev: 0 (always fresh)
  // UAT: 1 hour
  // Production: 24 hours
  get CACHE_TTL_MS(): number {
    return ENV.config.cacheTTL;
  },
};

/**
 * HOW TO USE:
 * 
 * 1. Create a private GitHub repository (e.g., "yourusername/scrimp-rewards-data")
 * 
 * 2. Generate a GitHub Personal Access Token:
 *    - Go to GitHub.com > Settings > Developer settings > Personal access tokens
 *    - Generate new token with 'repo' scope
 *    - Copy the token
 * 
 * 3. Update this file:
 *    - Set ENABLED to true
 *    - Set GITHUB_REPO to "yourusername/your-repo-name"
 *    - Set GITHUB_TOKEN to your PAT
 * 
 * 4. Upload your rewardsData.json to the GitHub repo:
 *    - Place it in the root of your repo
 *    - Optionally add images/ folder with card images
 * 
 * 5. Build and test:
 *    - The app will automatically fetch data on startup
 *    - Data is cached locally for 24 hours
 *    - Falls back to bundled data if fetch fails
 * 
 * SECURITY NOTES:
 * - Add this file to .gitignore to avoid committing credentials
 * - Use environment variables for production builds
 * - Consider using React Native Config or expo-constants for secrets
 * - Rotate tokens regularly
 * 
 * FOR PRODUCTION:
 * Instead of hardcoding here, use:
 * - process.env.GITHUB_REPO
 * - process.env.GITHUB_TOKEN
 * Or configure via EAS Build secrets for Expo apps
 */
