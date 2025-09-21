import { configCache } from './config-cache';

let isInitialized = false;

export async function initializeConfigurations(): Promise<void> {
  if (isInitialized) {
    console.log('⚠️ Configurations already initialized');
    return;
  }

  try {
    console.log('🚀 Initializing configuration system...');

    await configCache.initialize();

    isInitialized = true;
    console.log('✅ Configuration system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize configuration system:', error);
    throw error;
  }
}

export function getConfigStatus() {
  return {
    isInitialized,
    cacheStatus: configCache.getStatus(),
  };
}
