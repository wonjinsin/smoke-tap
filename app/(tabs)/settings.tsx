import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useTapStore } from '../../store/useTapStore';
import { t } from '../../i18n';
import { C } from '../../constants/colors';
import PaperBackground from '../../components/common/PaperBackground';
import Section from '../../components/settings/Section';
import Row from '../../components/settings/Row';

function formatStartDate(records: { timestamp: number }[]): string {
  if (records.length === 0) return t('settings.noStartDate');
  const first = records[0].timestamp;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(first));
}

export default function SettingsScreen() {
  const records = useTapStore((s) => s.records);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const [shakeUndo, setShakeUndo] = useState(true);
  const [haptic, setHaptic] = useState(true);

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title} allowFontScaling={false}>
              {t('settings.title')}
            </Text>
          </View>

          <Section title={t('settings.section.records')}>
            <Row
              label={t('settings.shakeUndo')}
              switched={shakeUndo}
              onToggle={() => setShakeUndo((v) => !v)}
            />
            <Row
              label={t('settings.haptic')}
              switched={haptic}
              onToggle={() => setHaptic((v) => !v)}
              last
            />
          </Section>

          <Section title={t('settings.section.data')}>
            <Row label={t('settings.iCloud')} value={t('settings.iCloudOff')} />
            <Row label={t('settings.startDate')} value={formatStartDate(records)} />
            <Row label={t('settings.exportCsv')} onPress={() => {}} last />
          </Section>

          <Section title={t('settings.section.app')}>
            <Row label={t('settings.appVersion')} value={version} />
            <Row label={t('settings.appIcon')} value={t('settings.appIconDefault')} />
            <Row label={t('settings.appearance')} value={t('settings.appearanceAuto')} last />
          </Section>

          <View style={styles.footer}>
            <Text style={styles.tagline} allowFontScaling={false}>
              {t('settings.tagline')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 24 },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    color: C.INK,
    letterSpacing: -0.6,
  },
  footer: {
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  tagline: {
    fontSize: 11,
    color: C.INK_40,
    lineHeight: 18,
  },
});
