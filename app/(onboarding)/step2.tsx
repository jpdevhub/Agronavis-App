import { useRouter } from 'expo-router';
import FarmFieldDrawer from '@/components/maps/FarmFieldDrawer';

export default function OnboardingStep2() {
  const router = useRouter();
  return (
    <FarmFieldDrawer
      mode="onboarding"
      onBack={() => router.back()}
      onSkip={() => router.push('/(onboarding)/step3' as any)}
      onComplete={() => router.push('/(onboarding)/step3' as any)}
    />
  );
}
