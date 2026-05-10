import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../../constants/colors';
import { t } from '../../i18n';

type Props = {
  data: number[];
};

export default function HourlyMini({ data }: Props) {
  const max = Math.max(1, ...data);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.caption} allowFontScaling={false}>
          {t('home.hourly')}
        </Text>
        <Text style={styles.range} allowFontScaling={false}>
          {t('home.hourlyRange')}
        </Text>
      </View>
      <View style={styles.barsRow}>
        {data.map((v, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: v === 0 ? 1 : `${(v / max) * 100}%`,
              backgroundColor: v === 0 ? C.INK_15 : C.INK,
              minHeight: 1,
              marginRight: i === 23 ? 0 : 2,
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.CARD,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.HAIR,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
    marginHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  caption: {
    fontSize: 11,
    color: C.INK_40,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  range: {
    fontSize: 11,
    color: C.INK_40,
    fontVariant: ['tabular-nums'],
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 28,
  },
});
