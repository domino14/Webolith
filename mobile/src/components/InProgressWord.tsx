import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface InProgressWordProps {
  word: string;
  totalLength: number;
  onUndo: () => void;
  onClear: () => void;
}

export function InProgressWord({ word, totalLength, onUndo, onClear }: InProgressWordProps) {
  const letters = word.split('');
  const empty = letters.length === 0;

  return (
    <View style={styles.container}>
      {/* Letter display */}
      <View style={styles.lettersRow}>
        {letters.map((letter, i) => {
          const isLast = i === letters.length - 1;
          return (
            <View key={i} style={styles.letterSlot}>
              <Text style={styles.letter}>{letter}</Text>
              {isLast && (
                <TouchableOpacity style={styles.undoChip} onPress={onUndo} hitSlop={8}>
                  <Text style={styles.undoText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
        {/* Ghost placeholders for remaining letters */}
        {Array.from({ length: totalLength - letters.length }).map((_, i) => (
          <View key={`ghost-${i}`} style={[styles.letterSlot, styles.ghostSlot]}>
            <Text style={styles.ghostLetter}>_</Text>
          </View>
        ))}
      </View>

      {/* Clear button — visible only when more than one letter typed */}
      {letters.length > 1 && (
        <TouchableOpacity style={styles.clearBtn} onPress={onClear} hitSlop={8}>
          <Text style={styles.clearText}>clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 52,
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  letterSlot: {
    alignItems: 'center',
    position: 'relative',
  },
  letter: {
    fontSize: 26,
    fontWeight: '700',
    color: '#e0e0ff',
    minWidth: 24,
    textAlign: 'center',
  },
  undoChip: {
    position: 'absolute',
    top: -10,
    right: -14,
    backgroundColor: '#5c6bc0',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
  },
  ghostSlot: {
    opacity: 0.3,
  },
  ghostLetter: {
    fontSize: 26,
    fontWeight: '700',
    color: '#6a6a9a',
    minWidth: 24,
    textAlign: 'center',
  },
  clearBtn: {
    marginTop: 4,
  },
  clearText: {
    fontSize: 12,
    color: '#6a6a9a',
  },
});
