import { useRouter } from 'expo-router';
import FarmFieldDrawer from '@/components/maps/FarmFieldDrawer';

export default function MapNewFarmScreen() {
  const router = useRouter();
  return (
    <FarmFieldDrawer
      mode="add-field"
      onBack={() => router.back()}
      onComplete={() => router.back()}
    />
  );
}
