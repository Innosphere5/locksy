import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [null, '0', 'del'],
];

export default function PinPad({ onKey, disabled = false }) {
  return (
    <View style={styles.pad}>
      {KEYS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key, ki) => {
            if (key === null) return <View key={ki} style={styles.emptyKey} />;
            return (
              <TouchableOpacity
                key={ki}
                style={[styles.key, disabled && styles.keyDisabled]}
                onPress={() => !disabled && onKey(key)}
                activeOpacity={0.6}
                disabled={disabled}
              >
                {key === 'del' ? (
                  <Text style={[styles.delIcon, disabled && styles.keyTextDisabled]}>⌫</Text>
                ) : (
                  <Text style={[styles.keyText, disabled && styles.keyTextDisabled]}>{key}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: 12, paddingHorizontal: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  key: {
    width: 90,
    height: 72,
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyKey: { width: 90, height: 72 },
  keyDisabled: { opacity: 0.4 },
  keyText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#0F172A',
  },
  delIcon: {
    fontSize: 22,
    color: '#64748B',
  },
  keyTextDisabled: { color: '#9CA3AF' },
});