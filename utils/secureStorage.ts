import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  GITHUB_PAT: '@finance_tracker:github_pat',
  GITHUB_REPO: '@finance_tracker:github_repo',
};

/**
 * Save GitHub Personal Access Token
 */
export async function saveGitHubToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GITHUB_PAT, token);
    console.log('GitHub token saved');
  } catch (error) {
    console.error('Error saving GitHub token:', error);
    throw error;
  }
}

/**
 * Get GitHub Personal Access Token
 */
export async function getGitHubToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.GITHUB_PAT);
  } catch (error) {
    console.error('Error getting GitHub token:', error);
    return null;
  }
}

/**
 * Clear GitHub Personal Access Token
 */
export async function clearGitHubToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.GITHUB_PAT);
    console.log('GitHub token cleared');
  } catch (error) {
    console.error('Error clearing GitHub token:', error);
    throw error;
  }
}

/**
 * Save GitHub repository name (format: username/repo)
 */
export async function saveGitHubRepo(repoName: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GITHUB_REPO, repoName);
    console.log('GitHub repo saved:', repoName);
  } catch (error) {
    console.error('Error saving GitHub repo:', error);
    throw error;
  }
}

/**
 * Get GitHub repository name
 */
export async function getGitHubRepo(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.GITHUB_REPO);
  } catch (error) {
    console.error('Error getting GitHub repo:', error);
    return null;
  }
}

/**
 * Clear GitHub repository name
 */
export async function clearGitHubRepo(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.GITHUB_REPO);
    console.log('GitHub repo cleared');
  } catch (error) {
    console.error('Error clearing GitHub repo:', error);
    throw error;
  }
}

/**
 * Save both token and repo
 */
export async function saveGitHubConfig(token: string, repoName: string): Promise<void> {
  await saveGitHubToken(token);
  await saveGitHubRepo(repoName);
}

/**
 * Get both token and repo
 */
export async function getGitHubConfig(): Promise<{ token: string | null; repoName: string | null }> {
  const token = await getGitHubToken();
  const repoName = await getGitHubRepo();
  return { token, repoName };
}

/**
 * Clear all GitHub configuration
 */
export async function clearGitHubConfig(): Promise<void> {
  await clearGitHubToken();
  await clearGitHubRepo();
}

/**
 * Check if GitHub is configured
 */
export async function isGitHubConfigured(): Promise<boolean> {
  const { token, repoName } = await getGitHubConfig();
  return Boolean(token && repoName);
}
