import { Redirect } from 'expo-router';
import { useSessionToken } from '@/lib/session';

export default function Index() {
  const token = useSessionToken();
  return <Redirect href={token ? '/cards' : '/login'} />;
}
