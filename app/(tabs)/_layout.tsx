import { Tabs } from 'expo-router';
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
  return (
    <>
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
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
