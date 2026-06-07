import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { useGame } from '../game/useGame';
import { Timer } from '../components/Timer';
import { AlphagramRow } from '../components/AlphagramRow';
import { TileRack } from '../components/TileRack';
import { InProgressWord } from '../components/InProgressWord';
import { BlankSelector } from '../components/BlankSelector';

// Enable LayoutAnimation on Android.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
  route: RouteProp<RootStackParamList, 'Game'>;
};

export function GameScreen({ navigation, route }: Props) {
  const { tablenum, listName } = route.params;
  const game = useGame(tablenum);

  // Total seconds — set once when phase transitions to 'playing'.
  const [totalSeconds, setTotalSeconds] = useState(0);
  const prevPhase = useRef(game.phase);
  useEffect(() => {
    if (prevPhase.current === 'loading' && game.phase === 'playing') {
      setTotalSeconds(game.secondsLeft);
    }
    prevPhase.current = game.phase;
  }, [game.phase, game.secondsLeft]);

  // Animate list changes.
  const prevCount = useRef(game.visibleQuestions.length);
  useEffect(() => {
    if (game.visibleQuestions.length !== prevCount.current) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      prevCount.current = game.visibleQuestions.length;
    }
  }, [game.visibleQuestions.length]);

  // Navigate to results when game ends.
  useEffect(() => {
    if (game.phase === 'ended') {
      navigation.replace('Results', {
        tablenum,
        solved: game.solvedWords,
        total: game.totalWords,
      });
    }
  }, [game.phase, navigation, tablenum, game.solvedWords, game.totalWords]);

  // -------------------------------------------------------------------------
  // Derived tile state for the selected alphagram
  // -------------------------------------------------------------------------

  const selectedQuestion = useMemo(
    () => game.visibleQuestions.find((q) => q.a === game.selectedAlpha) ?? null,
    [game.visibleQuestions, game.selectedAlpha],
  );

  const usedIndices = useMemo(() => new Set(game.tappedIndices), [game.tappedIndices]);

  // -------------------------------------------------------------------------
  // Shuffle handler
  // -------------------------------------------------------------------------

  const handleShuffle = useCallback(
    (alpha: string) => {
      // GameEngine.shuffle mutates and returns new visibleQuestions, but the
      // hook's state update comes through selectAlpha re-render. Trigger
      // via selectAlpha to keep state in sync.
      game.selectAlpha(alpha);
    },
    [game],
  );

  // -------------------------------------------------------------------------
  // Give up confirmation
  // -------------------------------------------------------------------------

  const handleGiveUp = useCallback(() => {
    Alert.alert('Give up?', 'End the round and see the results.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Give up', style: 'destructive', onPress: () => game.giveUp() },
    ]);
  }, [game]);

  // -------------------------------------------------------------------------
  // Loading / error states
  // -------------------------------------------------------------------------

  if (game.phase === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5c6bc0" />
        <Text style={styles.loadingText}>Loading challenge…</Text>
      </View>
    );
  }

  if (game.error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{game.error}</Text>
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Main game UI
  // -------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <Text style={styles.listName} numberOfLines={1}>{listName}</Text>
        <Text style={styles.score}>
          {game.solvedWords} / {game.totalWords}
        </Text>
        <TouchableOpacity onPress={handleGiveUp} style={styles.giveUpBtn}>
          <Text style={styles.giveUpText}>Give up</Text>
        </TouchableOpacity>
      </View>

      {/* Timer */}
      <Timer secondsLeft={game.secondsLeft} totalSeconds={totalSeconds} />

      {/* Column of alphagram rows */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {game.visibleQuestions.map((q) => (
          <AlphagramRow
            key={q.a}
            question={q}
            isSelected={q.a === game.selectedAlpha}
            onSelect={() => game.selectAlpha(q.a)}
            onShuffle={() => handleShuffle(q.a)}
          />
        ))}
        {game.visibleQuestions.length === 0 && (
          <View style={styles.allSolved}>
            <Text style={styles.allSolvedText}>All solved! ✓</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom: in-progress word + tile rack */}
      <View style={styles.bottomArea}>
        {selectedQuestion ? (
          <>
            <InProgressWord
              word={game.currentWord}
              totalLength={selectedQuestion.displayedAs.length}
              onUndo={game.undoTile}
              onClear={game.clearInput}
            />
            <TileRack
              letters={selectedQuestion.displayedAs}
              usedIndices={usedIndices}
              onTap={game.tapTile}
              disabled={game.phase !== 'playing'}
            />
          </>
        ) : (
          <View style={styles.noSelection}>
            <Text style={styles.noSelectionText}>Tap a row to start</Text>
          </View>
        )}
      </View>
      <BlankSelector
        visible={game.pendingBlankIndex !== null}
        onSelect={game.designateBlank}
        onDismiss={game.cancelBlank}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { color: '#9090b0', fontSize: 16 },
  errorText: { color: '#ff6b6b', padding: 20, textAlign: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  listName: {
    flex: 1,
    fontSize: 14,
    color: '#9090b0',
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e0e0ff',
  },
  giveUpBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4a4a6a',
  },
  giveUpText: {
    fontSize: 13,
    color: '#9090b0',
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingVertical: 4 },

  allSolved: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  allSolvedText: {
    fontSize: 22,
    color: '#5c6bc0',
    fontWeight: '600',
  },

  bottomArea: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4a',
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 8,
    backgroundColor: '#1e1e36',
    gap: 8,
  },

  noSelection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSelectionText: {
    color: '#6a6a8a',
    fontSize: 14,
  },
});
