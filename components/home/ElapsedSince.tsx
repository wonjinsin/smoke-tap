import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus, Text, TextStyle, StyleProp } from 'react-native';
import { t } from '../../i18n';
import { formatElapsed, ElapsedUnits } from '../../utils/formatElapsed';

type Props = {
  ts: number | null;
  style?: StyleProp<TextStyle>;
};

const units: ElapsedUnits = {
  d: (n) => t('main.units.d', { n }),
  h: (n) => t('main.units.h', { n }),
  m: (n) => t('main.units.m', { n }),
  s: (n) => t('main.units.s', { n }),
};

export default function ElapsedSince({ ts, style }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') setNow(Date.now());
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

  if (ts === null) {
    return (
      <Text style={style} allowFontScaling={false}>
        {t('main.noTapYet')}
      </Text>
    );
  }

  return (
    <Text style={style} allowFontScaling={false}>
      {t('main.elapsedSince', { value: formatElapsed(now - ts, units) })}
    </Text>
  );
}
