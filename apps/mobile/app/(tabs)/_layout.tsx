import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

// Exactly 4 tabs — no more, no less.
const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'dashboard/index', title: 'Dashboard', icon: 'dashboard'    },
  { name: 'farm',            title: 'My Farms',  icon: 'agriculture'  },
  { name: 'scan',            title: 'AI Scanner',icon: 'photo-camera' },
  { name: 'community/index', title: 'Community', icon: 'groups'       },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          shadowColor: '#0b1c30',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 20,
          position: 'absolute',
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.outline,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}
    >
      {TABS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name={icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
