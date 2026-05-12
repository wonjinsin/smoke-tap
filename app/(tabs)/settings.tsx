import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { t } from '../../i18n';
import { C } from '../../constants/colors';
import PaperBackground from '../../components/common/PaperBackground';
import Section from '../../components/settings/Section';
import Row from '../../components/settings/Row';

export default function SettingsScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title} allowFontScaling={false}>
              {t('settings.title')}
            </Text>
          </View>

          <Section title={t('settings.section.app')}>
            <Row label={t('settings.appVersion')} value={version} last />
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
