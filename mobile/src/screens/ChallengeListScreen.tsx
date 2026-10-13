import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  loadChallenge,
  fetchDefaultLists,
  loadAerolithList,
  type AerolithListOption,
} from '../api/wordwalls';
import { DEFAULT_LEXICON_ID } from '../api/config';
import { useAuth } from '../auth/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ChallengeList'>;
};

// ---------------------------------------------------------------------------
// Static daily challenge data
// ---------------------------------------------------------------------------

interface ChallengeEntry {
  id: number;
  name: string;
  timeSecs: number;
}

interface ChallengeGroup {
  title: string;
  challenges: ChallengeEntry[];
}

const CHALLENGE_GROUPS: ChallengeGroup[] = [
  {
    title: 'By Word Length',
    challenges: [
      { id: 2, name: "Today's 3s", timeSecs: 120 },
      { id: 3, name: "Today's 4s", timeSecs: 180 },
      { id: 4, name: "Today's 5s", timeSecs: 210 },
      { id: 5, name: "Today's 6s", timeSecs: 240 },
      { id: 6, name: "Today's 7s", timeSecs: 270 },
      { id: 7, name: "Today's 8s", timeSecs: 270 },
      { id: 8, name: "Today's 9s", timeSecs: 300 },
    ],
  },
  {
    title: 'Bingo Toughies',
    challenges: [
      { id: 15, name: "Week's Bingo Toughies", timeSecs: 300 },
      { id: 28, name: 'All-time Bingo Toughies', timeSecs: 300 },
      { id: 29, name: 'High Probability Toughies', timeSecs: 300 },
    ],
  },
  {
    title: 'Longer Challenges',
    challenges: [
      { id: 16, name: 'Blank Bingos', timeSecs: 540 },
      { id: 17, name: 'Bingo Marathon', timeSecs: 480 },
    ],
  },
  {
    title: 'Word Builder',
    challenges: [
      { id: 20, name: 'Word Builder (3-6)', timeSecs: 210 },
      { id: 21, name: 'Word Builder (4-7)', timeSecs: 270 },
      { id: 22, name: 'Word Builder (5-8)', timeSecs: 300 },
    ],
  },
  {
    title: 'Other Word Lengths',
    challenges: [
      { id: 1, name: "Today's 2s", timeSecs: 90 },
      { id: 9, name: "Today's 10s", timeSecs: 330 },
      { id: 10, name: "Today's 11s", timeSecs: 330 },
      { id: 11, name: "Today's 12s", timeSecs: 330 },
      { id: 12, name: "Today's 13s", timeSecs: 360 },
      { id: 13, name: "Today's 14s", timeSecs: 360 },
      { id: 14, name: "Today's 15s", timeSecs: 360 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Timer options for Aerolith Lists
// ---------------------------------------------------------------------------

const TIMER_OPTIONS = [
  { label: '3m', secs: 180 },
  { label: '5m', secs: 300 },
  { label: '10m', secs: 600 },
  { label: '15m', secs: 900 },
  { label: '20m', secs: 1200 },
];
const DEFAULT_TIMER_SECS = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

// ---------------------------------------------------------------------------
// Sub-views
// ---------------------------------------------------------------------------

function CardItem({
  title,
  meta,
  loading,
  onPress,
}: {
  title: string;
  meta: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={loading}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardMeta}>{meta}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color="#5c6bc0" />
      ) : (
        <Text style={styles.cardArrow}>›</Text>
      )}
    </TouchableOpacity>
  );
}

function DailyTab({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ChallengeList'>;
}) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const today = todayString();

  const handleSelect = useCallback(
    async (ch: ChallengeEntry) => {
      setLoadingId(ch.id);
      try {
        const result = await loadChallenge(DEFAULT_LEXICON_ID, ch.id, today);
        navigation.navigate('Game', {
          tablenum: result.tablenum,
          listName: result.list_name,
          lexicon: result.lexicon,
        });
      } catch (e: unknown) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Could not load challenge');
      } finally {
        setLoadingId(null);
      }
    },
    [navigation, today],
  );

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.dateLabel}>{today}</Text>
      {CHALLENGE_GROUPS.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {group.challenges.map((ch) => (
            <CardItem
              key={ch.id}
              title={ch.name}
              meta={formatTime(ch.timeSecs)}
              loading={loadingId === ch.id}
              onPress={() => handleSelect(ch)}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function ListsTab({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ChallengeList'>;
}) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [lists, setLists] = useState<AerolithListOption[]>([]);
  const [fetching, setFetching] = useState(true);
  const [timerSecs, setTimerSecs] = useState(DEFAULT_TIMER_SECS);

  useEffect(() => {
    fetchDefaultLists(DEFAULT_LEXICON_ID)
      .then(setLists)
      .catch(() => setLists([]))
      .finally(() => setFetching(false));
  }, []);

  const handleSelect = useCallback(
    async (list: AerolithListOption) => {
      setLoadingId(list.id);
      try {
        const result = await loadAerolithList(list.id, DEFAULT_LEXICON_ID, timerSecs);
        navigation.navigate('Game', {
          tablenum: result.tablenum,
          listName: result.list_name,
          lexicon: result.lexicon,
        });
      } catch (e: unknown) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Could not load list');
      } finally {
        setLoadingId(null);
      }
    },
    [navigation, timerSecs],
  );

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* Timer picker */}
      <View style={styles.timerRow}>
        <Text style={styles.timerLabel}>Timer:</Text>
        {TIMER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.secs}
            style={[styles.timerChip, timerSecs === opt.secs && styles.timerChipActive]}
            onPress={() => setTimerSecs(opt.secs)}
          >
            <Text style={[styles.timerChipText, timerSecs === opt.secs && styles.timerChipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {fetching ? (
        <ActivityIndicator color="#5c6bc0" style={{ marginTop: 40 }} />
      ) : lists.length === 0 ? (
        <Text style={styles.empty}>Could not load lists.</Text>
      ) : (
        lists.map((list) => (
          <CardItem
            key={list.id}
            title={list.name}
            meta={`${list.numAlphas} alphagrams`}
            loading={loadingId === list.id}
            onPress={() => handleSelect(list)}
          />
        ))
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

type TabId = 'daily' | 'lists';

export function ChallengeListScreen({ navigation }: Props) {
  const { username, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('daily');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WordWalls</Text>
        <View style={styles.headerRight}>
          {username ? <Text style={styles.username}>{username}</Text> : null}
          <TouchableOpacity onPress={signOut}>
            <Text style={styles.signOut}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['daily', 'lists'] as TabId[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'daily' ? 'Daily Challenges' : 'Aerolith Lists'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'daily' ? (
        <DailyTab navigation={navigation} />
      ) : (
        <ListsTab navigation={navigation} />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#e0e0ff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  username: { fontSize: 13, color: '#6a6a8a' },
  signOut: { fontSize: 14, color: '#9090b0' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#151528',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#5c6bc0',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6a6a8a',
  },
  tabTextActive: {
    color: '#c0c8ff',
  },

  scroll: { padding: 16, paddingBottom: 32 },
  dateLabel: { fontSize: 12, color: '#5a5a7a', marginBottom: 12, marginLeft: 2 },

  group: { marginBottom: 24 },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5c6bc0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#2a2a4a',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#e0e0ff' },
  cardMeta: { fontSize: 12, color: '#8080a0', marginTop: 3 },
  cardArrow: { fontSize: 24, color: '#5c6bc0', marginLeft: 8 },

  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  timerLabel: { fontSize: 13, color: '#8080a0' },
  timerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2a2a4a',
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  timerChipActive: {
    backgroundColor: '#3d3d80',
    borderColor: '#5c6bc0',
  },
  timerChipText: { fontSize: 13, color: '#8080a0', fontWeight: '600' },
  timerChipTextActive: { color: '#c0c8ff' },
  empty: { color: '#6a6a8a', textAlign: 'center', marginTop: 40 },
});
