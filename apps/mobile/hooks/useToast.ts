// apps/mobile/hooks/useToast.ts
import { Alert } from 'react-native';

export function useToast() {
  return {
    error: (msg: string) => Alert.alert('Error', msg),
  };
}
