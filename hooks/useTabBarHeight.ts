import { useContext } from 'react';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FLOATING_BAR_HEIGHT } from '@/components/navigation/FloatingTabBar';

/**
 * Space the floating tab bar occupies over this screen, or 0 when there isn't
 * one. The bar is absolutely positioned so React Navigation measures it as
 * zero — the height is derived instead. The context is still what tells us
 * whether we are inside the tab navigator at all, since these screens are also
 * reached from onboarding.
 */
export function useTabBarHeight(): number {
  const inTabs = useContext(BottomTabBarHeightContext) !== undefined;
  const insets = useSafeAreaInsets();
  return inTabs ? FLOATING_BAR_HEIGHT + insets.bottom : 0;
}
