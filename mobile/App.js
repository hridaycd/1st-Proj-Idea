import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import * as Sentry from 'sentry-expo';
import { setupAnalytics } from './src/observability/analytics';
import { getSentryDsn } from './src/constants/config';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation';

function AppContainer() {
  const { isBootstrapping } = useAuth();
  if (isBootstrapping) {
    return null;
  }
  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  // Init Sentry and analytics once
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const dsn = getSentryDsn();
    if (dsn) {
      Sentry.init({
        dsn,
        enableInExpoDevelopment: true,
        debug: false,
      });
    }
    setupAnalytics();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <AppContainer />
      </NavigationContainer>
    </AuthProvider>
  );
}

