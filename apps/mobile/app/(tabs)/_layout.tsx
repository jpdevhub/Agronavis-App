import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IconName;
  activeIcon: IconName;
}

const TABS: TabConfig[] = [
  { name: 'dashboard', title: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'farm', title: 'Farm', icon: 'leaf-outline', activeIcon: 'leaf' },
  { name: 'crops', title: 'Crops', icon: 'nutrition-outline', activeIcon: 'nutrition' },
  { name: 'advisory', title: 'Advisory', icon: 'bulb-outline', activeIcon: 'bulb' },
  { name: 'community', title: 'Community', icon: 'people-outline', activeIcon: 'people' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0E3D1F',
          borderTopColor: '#1A5C30',
          height: 65,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#6B9F7E',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {TABS.map(({ name, title, icon, activeIcon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? activeIcon : icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
