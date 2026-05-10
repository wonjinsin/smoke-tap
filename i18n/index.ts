import { getLocales } from 'expo-localization';
import ko from './locales/ko.json';

type LocaleDict = typeof ko;

const locales: Record<string, LocaleDict> = { ko };

function getDict(): LocaleDict {
  const lang = getLocales()[0]?.languageCode ?? 'ko';
  return locales[lang] ?? locales['ko'];
}

function getNestedValue(
  obj: Record<string, unknown>,
  keys: string[]
): string {
  let current: unknown = obj;
  for (const key of keys) {
    if (typeof current !== 'object' || current === null) return '';
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : '';
}

export function t(
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = getDict();
  let str = getNestedValue(
    dict as unknown as Record<string, unknown>,
    key.split('.')
  );
  if (!str) return key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(`{{${k}}}`, String(v));
    });
  }
  return str;
}
