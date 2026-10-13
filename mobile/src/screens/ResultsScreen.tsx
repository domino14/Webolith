import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { fetchLeaderboard } from '../api/wordwalls';
import type { LeaderboardEntry } from '../api/wordwalls';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Results'>;
  route: RouteProp<RootStackParamList, 'Results'>;
};

export function ResultsScreen({ navigation, route }: Props) {
  const { tablenum, solved, total } = route.params;
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);

  useEffect(() => {
    fetchLeaderboard(tablenum)
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => {}) // leaderboard failure is non-fatal
      .finally(() => setLoadingBoard(false));
  }, [tablenum]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Score summary */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>You solved</Text>
          <Text style={styles.scoreNumber}>{solved}</Text>
          <Text style={styles.scoreTotal}>out of {total} words ({pct}%)</Text>
        </View>

        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        {loadingBoard ? (
          <ActivityIndicator color="#5c6bc0" style={{ marginTop: 16 }} />
        ) : entries.length === 0 ? (
          <Text style={styles.empty}>No leaderboard data.</Text>
        ) : (
          entries.map((entry, i) => (
            <View key={entry.user} style={styles.entryRow}>
              <Text style={styles.rank}>#{i + 1}</Text>
              <Text style={styles.entryUser}>{entry.user}</Text>
              <Text style={styles.entryScore}>{entry.score}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.playAgainBtn}
          onPress={() => navigation.replace('ChallengeList')}
        >
          <Text style={styles.playAgainText}>Back to challenges</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 20 },

  scoreCard: {
    backgroundColor: '#2a2a4a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#3a3a6a',
  },
  scoreLabel: { fontSize: 16, color: '#9090b0', marginBottom: 4 },
  scoreNumber: { fontSize: 64, fontWeight: '700', color: '#5c6bc0', lineHeight: 72 },
  scoreTotal: { fontSize: 15, color: '#9090b0', marginTop: 4 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9090b0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252540',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333360',
  },
  rank: { fontSize: 14, color: '#6a6a9a', width: 32 },
  entryUser: { flex: 1, fontSize: 16, color: '#e0e0ff', fontWeight: '500' },
  entryScore: { fontSize: 16, fontWeight: '700', color: '#5c6bc0' },

  empty: { color: '#6a6a8a', textAlign: 'center', marginTop: 16 },

  footer: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4a',
  },
  playAgainBtn: {
    backgroundColor: '#5c6bc0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  playAgainText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
