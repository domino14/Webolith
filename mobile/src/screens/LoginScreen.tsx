import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { loginWithPassword, loginWithGoogle } from '../api/auth';
import { useGoogleSignIn } from '../auth/GoogleSignIn';

export function LoginScreen() {
  const { signIn } = useAuth();
  const { promptAsync, isReady: googleReady } = useGoogleSignIn();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordLogin = async () => {
    if (!username.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      const result = await loginWithPassword(username.trim(), password);
      await signIn(result.token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const idToken = await promptAsync();
      if (!idToken) {
        setLoading(false);
        return;
      }
      const result = await loginWithGoogle(idToken);
      await signIn(result.token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>WordWalls</Text>
        <Text style={styles.subtitle}>Sign in to play</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          onSubmitEditing={handlePasswordLogin}
          returnKeyType="go"
        />

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handlePasswordLogin}
          disabled={loading || !username.trim() || !password}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={loading || !googleReady}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#e0e0ff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#9090b0',
    textAlign: 'center',
    marginBottom: 40,
  },
  error: {
    color: '#ff6b6b',
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2a2a4a',
    color: '#e0e0ff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#5c6bc0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3a3a5a',
  },
  dividerText: {
    color: '#6a6a8a',
    marginHorizontal: 12,
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
