import React from 'react';
import { Tabs } from 'expo-router';
import { t } from '../../i18n';
import { C } from '../../constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.INK,
        tabBarInactiveTintColor: C.INK_40,
        tabBarStyle: {
          backgroundColor: C.BG,
          borderTopWidth: 1,
          borderTopColor: C.HAIR,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          letterSpacing: 0.4,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: t('tabs.main'),
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarLabel: t('tabs.stats'),
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: t('tabs.settings'),
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}
