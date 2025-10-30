import Constants from 'expo-constants';

export function getApiBaseUrl() {
  // Prefer EXPO_PUBLIC_API_BASE_URL if set in EAS env
  if (process.env.EXPO_PUBLIC_API_BASE_URL) return process.env.EXPO_PUBLIC_API_BASE_URL;
  const extra = Constants?.expoConfig?.extra || Constants?.manifest?.extra;
  if (extra?.environment === 'production' && extra?.productionApiBaseUrl) return extra.productionApiBaseUrl;
  return extra?.apiBaseUrl || 'http://localhost:8000';
}

export function getSentryDsn() {
  return process.env.EXPO_PUBLIC_SENTRY_DSN || (Constants?.expoConfig?.extra || {}).sentryDsn || '';
}

export function getAmplitudeApiKey() {
  return process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || (Constants?.expoConfig?.extra || {}).amplitudeApiKey || '';
}

