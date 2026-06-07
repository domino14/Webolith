import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { configureClient } from '../api/client';
import { refreshJwt } from '../api/auth';
import { JWT_RENEWAL_BUFFER_MINUTES } from '../api/config';

const JWT_KEY = 'aerolith_jwt';

// ---------------------------------------------------------------------------
// JWT claim decoding (no library needed — just base64 decode the payload)
// ---------------------------------------------------------------------------

interface JwtClaims {
  sub: string;
  usn: string;
  mbr: boolean;
  exp: number;
}

function decodeJwtClaims(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1];
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(padded);
    return JSON.parse(decoded) as JwtClaims;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------

interface AuthState {
  token: string | null;
  username: string | null;
  member: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    username: null,
    member: false,
    isLoading: true,
  });

  // Keep a ref so the client getter always reads the latest token
  // without depending on React's effect scheduling order.
  const tokenRef = useRef<string | null>(null);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  /**
   * Store a fresh token, decode claims, and schedule the next proactive refresh.
   */
  const signIn = useCallback(async (token: string) => {
    await SecureStore.setItemAsync(JWT_KEY, token);
    // Update the ref immediately so the API client has the token
    // before any child useEffect fires after the state update.
    tokenRef.current = token;
    const claims = decodeJwtClaims(token);

    setState({
      token,
      username: claims?.usn ?? null,
      member: claims?.mbr ?? false,
      isLoading: false,
    });

    // Schedule proactive refresh JWT_RENEWAL_BUFFER_MINUTES before expiry.
    if (claims?.exp) {
      const msUntilExpiry = claims.exp * 1000 - Date.now();
      const renewIn = Math.max(
        1000,
        msUntilExpiry - JWT_RENEWAL_BUFFER_MINUTES * 60 * 1000,
      );
      clearRefreshTimer();
      refreshTimerRef.current = setTimeout(async () => {
        const newToken = await refreshJwt(token);
        if (newToken) {
          await signIn(newToken);
        } else {
          await signOut();
        }
      }, renewIn);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearRefreshTimer]);

  const signOut = useCallback(async () => {
    clearRefreshTimer();
    tokenRef.current = null;
    await SecureStore.deleteItemAsync(JWT_KEY);
    setState({ token: null, username: null, member: false, isLoading: false });
  }, [clearRefreshTimer]);

  // Boot: load persisted token from SecureStore.
  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(JWT_KEY);
      if (!stored) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }
      const claims = decodeJwtClaims(stored);
      if (!claims || claims.exp * 1000 < Date.now()) {
        // Expired — try a silent refresh.
        const refreshed = await refreshJwt(stored);
        if (refreshed) {
          await signIn(refreshed);
        } else {
          await signOut();
        }
        return;
      }
      await signIn(stored);
    })();
  }, [signIn, signOut]);

  // Wire up the API client once at mount. The getters read from tokenRef
  // which is updated synchronously in signIn/signOut, so there's no
  // effect-scheduling race with child components' first fetch.
  useEffect(() => {
    configureClient(
      () => tokenRef.current,
      async () => {
        if (!tokenRef.current) return null;
        const newToken = await refreshJwt(tokenRef.current);
        if (newToken) await signIn(newToken);
        return newToken;
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
