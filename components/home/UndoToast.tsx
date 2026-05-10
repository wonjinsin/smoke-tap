import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { C } from '../../constants/colors';
import { t } from '../../i18n';

type Props = {
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
  resetKey: number;
};

const DURATION_MS = 4000;

export default function UndoToast({ visible, onUndo, onDismiss, resetKey }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => onDismiss(), DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible, resetKey, opacity, translateY, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        { opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.row}>
        <Text style={styles.text} allowFontScaling={false}>
          {t('toast.added')}
        </Text>
        <Pressable onPress={onUndo} style={styles.undoBtn}>
          <Text style={styles.undoText} allowFontScaling={false}>
            {t('toast.undo')}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 88,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.INK,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 14,
    gap: 14,
  },
  text: {
    color: C.BG,
    fontSize: 13,
  },
  undoBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245,242,236,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  undoText: {
    color: C.BG,
    fontSize: 12,
  },
});
