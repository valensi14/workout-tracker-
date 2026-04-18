// apps/mobile/app/_layout.tsx
import { Stack } from 'expo-router';
import { DBProvider } from '../db';

export default function RootLayout() {
  return (
    <DBProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout/[id]" options={{ title: 'Workout', presentation: 'modal' }} />
        <Stack.Screen name="programs/new" options={{ title: 'New Program' }} />
      </Stack>
    </DBProvider>
  );
}
