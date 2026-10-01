import { Redirect } from 'expo-router';

/** The tab was called Friends in 1.1.0: old links and the 1.1.0 web fallback still open /friends. */
export default function FriendsRedirect() {
  return <Redirect href="/profile" />;
}
