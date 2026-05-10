import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../../constants/colors';

export type BarItem = {
  count: number;
  label: string;
};

type Props = {
  data: BarItem[];
  highlightLast?: boolean;
};

const BAR_AREA_HEIGHT = 180;

export default function BarChart({ data, highlightLast = true }: Props) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <View style={styles.row}>
      {data.map((item, i) => {
        const isHighlight = highlightLast && i === data.length - 1;
        const heightPct = (item.count / max) * 100;
        const color = isHighlight ? C.INK : C.INK_40;
        return (
          <View key={i} style={styles.col}>
            <View style={styles.barArea}>
              <View
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  backgroundColor: color,
                }}
              />
            </View>
            <Text style={styles.count} allowFontScaling={false}>
              {item.count}
            </Text>
            <Text style={styles.label} allowFontScaling={false}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    height: BAR_AREA_HEIGHT + 36,
    gap: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  barArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  count: {
    fontSize: 11,
    color: C.INK_40,
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 11,
    color: C.INK_70,
    marginTop: 2,
  },
});
