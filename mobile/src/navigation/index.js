import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigationContainerRef } from '@react-navigation/native';
import { trackEvent } from '../observability/analytics';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HotelsScreen from '../screens/HotelsScreen';
import RestaurantsScreen from '../screens/RestaurantsScreen';
import BookingsScreen from '../screens/BookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Hotels" component={HotelsScreen} />
      <Tab.Screen name="Restaurants" component={RestaurantsScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { token } = useAuth();
  const navRef = useNavigationContainerRef();
  const routeNameRef = useRef();

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentRouteName = navRef.getCurrentRoute()?.name;
      routeNameRef.current = currentRouteName;
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const unsubscribe = navRef.addListener('state', () => {
      const previousRouteName = routeNameRef.current;
      const currentRouteName = navRef.getCurrentRoute()?.name;
      if (previousRouteName !== currentRouteName && currentRouteName) {
        trackEvent('screen_view', { screen: currentRouteName });
      }
      routeNameRef.current = currentRouteName;
    });
    return unsubscribe;
  }, [navRef]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="App" component={AppTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

