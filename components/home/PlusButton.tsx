import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, Easing } from 'react-native';
import { C } from '../../constants/colors';

type Props = {
  onPress: () => void;
};

export default function PlusButton({ onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.timing(scale, {
      toValue: 0.92,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };
  const pressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[styles.btn, { transform: [{ scale }] }]}>
        <Text style={styles.plus} allowFontScaling={false}>
          +
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.INK,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  plus: {
    color: C.BG,
    fontSize: 38,
    fontWeight: '200',
    lineHeight: 42,
  },
});
