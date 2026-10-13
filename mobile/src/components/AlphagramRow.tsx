import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { VisibleQuestion } from '../game/GameEngine';

interface AlphagramRowProps {
  question: VisibleQuestion;
  isSelected: boolean;
  onSelect: () => void;
  onShuffle: () => void;
}

export function AlphagramRow({ question, isSelected, onSelect, onShuffle }: AlphagramRowProps) {
  const hasMultiple = question.totalAnswers > 1;
  const partialSolve = question.answersRemaining < question.totalAnswers;

  return (
    <TouchableOpacity
      style={[styles.row, isSelected && styles.rowSelected, question.wrongGuess && styles.rowWrong]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      {/* Mini tile display of the alphagram */}
      <TouchableOpacity onPress={onShuffle} style={styles.tilesArea} activeOpacity={0.6}>
        <View style={styles.tiles}>
          {question.displayedAs.map((letter, i) => (
            <View key={i} style={[styles.miniTile, isSelected && styles.miniTileSelected]}>
              <Text style={styles.miniTileText}>{letter}</Text>
            </View>
          ))}
        </View>
        {hasMultiple && (
          <View style={[styles.badge, partialSolve && styles.badgePartial]}>
            <Text style={styles.badgeText}>{question.answersRemaining}</Text>
          </View>
        )}
      </TouchableOpacity>

      {isSelected && <View style={styles.selectedIndicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    marginVertical: 3,
    borderRadius: 10,
    backgroundColor: '#252540',
    borderWidth: 1,
    borderColor: '#333360',
  },
  rowSelected: {
    backgroundColor: '#2e2e5a',
    borderColor: '#5c6bc0',
  },
  rowWrong: {
    backgroundColor: '#3a1a1a',
    borderColor: '#ff4444',
  },
  tilesArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  miniTile: {
    width: 36,
    height: 36,
    borderRadius: 5,
    backgroundColor: '#3a3a60',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a4a7a',
  },
  miniTileSelected: {
    backgroundColor: '#4a4a80',
    borderColor: '#7070c0',
  },
  miniTileText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e0e0ff',
  },
  badge: {
    marginLeft: 8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#5c6bc0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgePartial: {
    backgroundColor: '#ffaa00',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  selectedIndicator: {
    width: 4,
    height: 30,
    borderRadius: 2,
    backgroundColor: '#5c6bc0',
    marginLeft: 8,
  },
});
