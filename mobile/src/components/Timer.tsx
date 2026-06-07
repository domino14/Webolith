import React, { useMemo } from 'react';
import { Text, StyleSheet, View } from 'react-native';

interface TimerProps {
  secondsLeft: number;
  totalSeconds: number;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function Timer({ secondsLeft, totalSeconds }: TimerProps) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isWarning = secondsLeft <= 30;
  const isCritical = secondsLeft <= 10;

  const barWidth = useMemo(
    () => (totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0),
    [secondsLeft, totalSeconds],
  );

  const barColor = isCritical ? '#ff4444' : isWarning ? '#ffaa00' : '#5c6bc0';

  return (
    <View style={styles.container}>
      <Text style={[styles.time, isCritical && styles.critical, isWarning && !isCritical && styles.warning]}>
        {pad(mins)}:{pad(secs)}
      </Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${barWidth}%` as any, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  time: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e0e0ff',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  warning: { color: '#ffaa00' },
  critical: { color: '#ff4444' },
  barTrack: {
    height: 4,
    backgroundColor: '#2a2a4a',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});
