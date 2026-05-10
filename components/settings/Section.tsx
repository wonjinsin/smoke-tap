import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../../constants/colors';

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function Section({ title, children }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.caption} allowFontScaling={false}>
        {title}
      </Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 28,
  },
  caption: {
    fontSize: 11,
    color: C.INK_40,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: C.CARD,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.HAIR,
  },
});
