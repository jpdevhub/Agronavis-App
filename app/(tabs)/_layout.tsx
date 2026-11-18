import { useCallback } from 'react';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';
import { SahayakGateway } from '@/features/sahayak';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

// Exactly 4 tabs — no more, no less.
const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'dashboard/index', title: 'Dashboard', icon: 'dashboard'    },
  { name: 'farm',            title: 'My Farms',  icon: 'agriculture'  },
  { name: 'scan',            title: 'AI Scanner',icon: 'photo-camera' },
  { name: 'community/index', title: 'Community', icon: 'groups'       },
];

export default function TabsLayout() {
  // Hoisted out of the element tree: an inline arrow is a new prop identity
  // on every render, which re-renders the bar on each tab change.
  const renderTabBar = useCallback((props: BottomTabBarProps) => <FloatingTabBar {...props} />, []);

  return (
    <>
    <Tabs
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        /**
         * Tabs default to no animation, so a switch is an instant swap — and
         * the first visit to a tab swaps to a screen that is still mounting,
         * which is the blank frame. A fade covers the mount and gives the
         * change somewhere to happen.
         */
        animation: 'fade',
        transitionSpec: { animation: 'timing', config: { duration: 180 } },
        /**
         * A blurred tab keeps its tree but stops re-rendering, so coming back
         * is instant and its queries do not drive the UI thread while another
         * tab is on screen.
         */
        freezeOnBlur: true,
        lazy: true,
      }}
    >
      {TABS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ title, tabBarIconName: icon } as never}
        />
      ))}
    </Tabs>
    <SahayakGateway />
    </>
  );
}
