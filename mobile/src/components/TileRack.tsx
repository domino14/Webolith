import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface TileRackProps {
  letters: string[];
  usedIndices: Set<number>;
  onTap: (index: number) => void;
  disabled?: boolean;
}

export function TileRack({ letters, usedIndices, onTap, disabled }: TileRackProps) {
  return (
    <View style={styles.rack}>
      {letters.map((letter, i) => {
        const used = usedIndices.has(i);
        return (
          <Pressable
            key={i}
            style={({ pressed }) => [
              styles.tile,
              used && styles.tileUsed,
              disabled && styles.tileDisabled,
              pressed && !used && !disabled && styles.tilePressed,
            ]}
            onPress={() => !used && !disabled && onTap(i)}
            disabled={used || disabled}
          >
            <Text style={[styles.tileText, used && styles.tileTextUsed]}>{letter}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  tile: {
    width: 46,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#4a4a90',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7070c0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  tileUsed: {
    backgroundColor: '#2a2a4a',
    borderColor: '#3a3a5a',
    opacity: 0.3,
  },
  tileDisabled: {
    opacity: 0.5,
  },
  tilePressed: {
    opacity: 0.6,
    transform: [{ scale: 0.93 }],
  },
  tileText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
  },
  tileTextUsed: {
    color: '#555580',
  },
});
