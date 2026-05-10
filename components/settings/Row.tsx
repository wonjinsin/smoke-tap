import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../../constants/colors';

type Props = {
  label: string;
  value?: string;
  switched?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  last?: boolean;
};

export default function Row({ label, value, switched, onToggle, onPress, last }: Props) {
  const inner = (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.label} allowFontScaling={false} numberOfLines={1}>
        {label}
      </Text>
      {switched !== undefined ? (
        <Toggle on={switched} onPress={onToggle ?? (() => {})} />
      ) : value !== undefined ? (
        <Text style={styles.value} allowFontScaling={false}>
          {value}
        </Text>
      ) : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.track, { backgroundColor: on ? C.INK : C.INK_15 }]}
    >
      <View style={[styles.knob, { left: on ? 18 : 2 }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.HAIR,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: C.INK,
  },
  value: {
    fontSize: 14,
    color: C.INK_40,
    marginLeft: 16,
  },
  track: {
    width: 36,
    height: 20,
    borderRadius: 10,
    position: 'relative',
  },
  knob: {
    position: 'absolute',
    top: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.BG,
  },
});
