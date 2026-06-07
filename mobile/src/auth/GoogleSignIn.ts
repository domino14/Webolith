/**
 * Thin wrapper around expo-auth-session for Google OAuth.
 *
 * Usage:
 *   const { request, promptAsync } = useGoogleSignIn();
 *   // later:
 *   const idToken = await promptAsync();
 *
 * The caller is responsible for passing the idToken to loginWithGoogle().
 *
 * Client IDs must be configured in app.json under
 *   expo.extra.googleClientIdAndroid and expo.extra.googleClientIdIos,
 * or set via EXPO_PUBLIC_GOOGLE_CLIENT_ID_* env vars in eas.json.
 */
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';

const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? '';

export function useGoogleSignIn(): {
  promptAsync: () => Promise<string | null>;
  isReady: boolean;
} {
  // Must be inside the hook — useAutoDiscovery is a hook itself.
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  const [nonce, setNonce] = useState('');

  useEffect(() => {
    Crypto.getRandomBytesAsync(16).then((bytes) => {
      setNonce(
        Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      );
    });
  }, []);

  const redirectUri = AuthSession.makeRedirectUri();

  const [request] = AuthSession.useAuthRequest(
    {
      clientId: IOS_CLIENT_ID || ANDROID_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'email', 'profile'],
      extraParams: { nonce },
      responseType: AuthSession.ResponseType.IdToken,
    },
    discovery,
  );

  const promptAsync = async (): Promise<string | null> => {
    if (!request) return null;
    const result = await request.promptAsync(discovery!);
    if (result.type === 'success') {
      return result.params.id_token ?? null;
    }
    return null;
  };

  return { promptAsync, isReady: !!request };
}
