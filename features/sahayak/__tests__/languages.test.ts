import fs from 'fs';
import path from 'path';
import { LANGUAGES } from '@/constants';

/**
 * Every language the picker offers must actually do something.
 *
 * Bengali was listed in the picker and shown in Sahayak's header, but was
 * missing from both maps below — so a farmer chose বাংলা, saw বাংলা on screen,
 * and got answers in English. Nothing failed; it just quietly did not work.
 * These read the two maps and assert the picker never again offers a language
 * that neither of them knows.
 */

const read = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

function mapKeys(source: string, after: string): string[] {
  const body = source.slice(source.indexOf(after));
  return [...body.slice(0, body.indexOf('};')).matchAll(/(\w+):\s*'/g)].map((m) => m[1]);
}

const promptLanguages = mapKeys(read('farmerContext.ts'), 'const LANGUAGE_NAME');
const speechLocales = mapKeys(read('useSahayakVoice.ts'), 'const LOCALE');

describe('the language picker', () => {
  it.each(LANGUAGES.map((l) => [l.code, l.label]))(
    '%s (%s) can be answered in',
    (code) => {
      expect(promptLanguages).toContain(code);
    },
  );

  it.each(LANGUAGES.map((l) => [l.code, l.label]))(
    '%s (%s) can be spoken and heard',
    (code) => {
      expect(speechLocales).toContain(code);
    },
  );

  it('offers English first, since it is the one the screens are written in', () => {
    expect(LANGUAGES[0].code).toBe('en');
  });

  it('labels each language in its own script, not in English', () => {
    // "Hindi" in a list a Hindi speaker is reading is no help to them.
    const nonEnglish = LANGUAGES.filter((l) => l.code !== 'en');
    for (const { label } of nonEnglish) {
      expect(label).not.toMatch(/^[A-Za-z ]+$/);
    }
  });
});
