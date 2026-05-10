import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Easing } from 'react-native';
import { C } from '../../constants/colors';
import { t } from '../../i18n';

type Props = {
  count: number;
  tick: number;
};

const SIZE = 220;

export default function CountDisplay({ count, tick }: Props) {
  const ringScale1 = useRef(new Animated.Value(1)).current;
  const ringOpacity1 = useRef(new Animated.Value(0)).current;
  const ringScale2 = useRef(new Animated.Value(1)).current;
  const ringOpacity2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tick === 0) return;
    const sequences: Array<[Animated.Value, Animated.Value, number]> = [
      [ringScale1, ringOpacity1, 0],
      [ringScale2, ringOpacity2, 120],
    ];
    sequences.forEach(([scale, opacity, delay]) => {
      scale.setValue(1);
      opacity.setValue(0.35);
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.45,
          duration: 700,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 700,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [tick, ringScale1, ringOpacity1, ringScale2, ringOpacity2]);

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ringScale1 }], opacity: ringOpacity1 },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ringScale2 }], opacity: ringOpacity2 },
        ]}
      />
      <View style={styles.disc}>
        <Text style={styles.number} allowFontScaling={false}>
          {count}
        </Text>
        <Text style={styles.label} allowFontScaling={false}>
          {t('main.today')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    borderColor: C.INK,
  },
  disc: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: C.CARD,
    borderWidth: 1,
    borderColor: C.INK_15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 96,
    fontWeight: '200',
    color: C.INK,
    letterSpacing: -3,
    lineHeight: 100,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 12,
    color: C.INK_40,
    letterSpacing: 0.4,
    marginTop: 6,
  },
});
