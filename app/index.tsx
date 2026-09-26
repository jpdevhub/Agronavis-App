import { Redirect } from 'expo-router';

/** Entry URL. The root layout redirects once it knows the session. */
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
