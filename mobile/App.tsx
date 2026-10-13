import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { ChallengeListScreen } from './src/screens/ChallengeListScreen';
import { GameScreen } from './src/screens/GameScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#5c6bc0" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#e0e0ff',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      {token == null ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="ChallengeList"
            component={ChallengeListScreen}
            options={{ title: 'WordWalls', headerBackVisible: false }}
          />
          <Stack.Screen
            name="Game"
            component={GameScreen}
            options={({ route }) => ({
              title: route.params.lexicon,
              headerBackTitle: 'Challenges',
            })}
          />
          <Stack.Screen
            name="Results"
            component={ResultsScreen}
            options={{ title: 'Results', headerBackVisible: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
