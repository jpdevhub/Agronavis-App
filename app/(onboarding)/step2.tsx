import { useRouter } from 'expo-router';
import { useGoBack } from '@/hooks/useGoBack';
import FarmFieldDrawer from '@/components/maps/FarmFieldDrawer';

export default function OnboardingStep2() {
  const router = useRouter();
  const goBack = useGoBack('/(onboarding)/step1');
  return (
    <FarmFieldDrawer
      mode="onboarding"
      onBack={() => goBack()}
      onSkip={() => router.push('/(onboarding)/step3' as any)}
      onComplete={() => router.push('/(onboarding)/step3' as any)}
    />
  );
}
