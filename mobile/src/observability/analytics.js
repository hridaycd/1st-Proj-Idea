import { init, track, identify } from '@amplitude/analytics-react-native';
import { getAmplitudeApiKey } from '../constants/config';

let analyticsReady = false;

export function setupAnalytics() {
  const key = getAmplitudeApiKey();
  if (!key) return;
  init(key);
  analyticsReady = true;
}

export function trackEvent(name, properties) {
  if (!analyticsReady) return;
  try {
    track(name, properties || {});
  } catch {}
}

export function identifyUser(userId, userProperties) {
  if (!analyticsReady) return;
  try {
    if (userId) identify(userId, userProperties || {});
  } catch {}
}

