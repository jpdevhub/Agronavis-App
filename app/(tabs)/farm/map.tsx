import { useRouter } from 'expo-router';
import { useGoBack } from '@/hooks/useGoBack';
import FarmFieldDrawer from '@/components/maps/FarmFieldDrawer';

export default function MapNewFarmScreen() {
  const router = useRouter();
  const goBack = useGoBack('/(tabs)/farm');
  return (
    <FarmFieldDrawer
      mode="add-field"
      onBack={() => goBack()}
      onComplete={() => goBack()}
    />
  );
}
