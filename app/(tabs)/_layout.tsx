import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../../i18n';
import { C } from '../../constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcon = (outline: IoniconName, filled: IoniconName) =>
  ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
    <Ionicons name={focused ? filled : outline} size={size} color={color} />
  );

export default function TabLayout() {
  const insets = useSafeAreaInsets();
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
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          letterSpacing: 0.4,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: t('tabs.main'),
          tabBarIcon: tabIcon('today-outline', 'today'),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarLabel: t('tabs.stats'),
          tabBarIcon: tabIcon('bar-chart-outline', 'bar-chart'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: t('tabs.settings'),
          tabBarIcon: tabIcon('settings-outline', 'settings'),
        }}
      />
    </Tabs>
  );
}
