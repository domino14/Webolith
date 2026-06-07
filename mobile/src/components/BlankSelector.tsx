import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface BlankSelectorProps {
  visible: boolean;
  onSelect: (letter: string) => void;
  onDismiss: () => void;
}

export function BlankSelector({ visible, onSelect, onDismiss }: BlankSelectorProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Choose the blank letter</Text>
          <View style={styles.grid}>
            {LETTERS.map((letter) => (
              <Pressable
                key={letter}
                style={({ pressed }) => [styles.letterBtn, pressed && styles.letterBtnPressed]}
                onPress={() => onSelect(letter)}
              >
                <Text style={styles.letterText}>{letter}</Text>
              </Pressable>
            ))}
          </View>
          <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e1e36',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#3a3a5a',
  },
  title: {
    color: '#9090b0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  letterBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#4a4a90',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6060a0',
  },
  letterBtnPressed: {
    backgroundColor: '#6060b0',
    transform: [{ scale: 0.93 }],
  },
  letterText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  cancelBtn: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  cancelText: {
    color: '#6a6a8a',
    fontSize: 15,
  },
});
