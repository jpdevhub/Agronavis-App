import en from '../locales/en.json';
import hi from '../locales/hi.json';

type Catalogue = Record<string, Record<string, string>>;

const flatten = (c: Catalogue): string[] =>
  Object.entries(c).flatMap(([ns, keys]) => Object.keys(keys).map((k) => `${ns}.${k}`));

describe('translation catalogues', () => {
  it('has the same keys in both languages', () => {
    expect(flatten(hi as Catalogue).sort()).toEqual(flatten(en as Catalogue).sort());
  });

  it('leaves no Hindi string as its English source', () => {
    const untranslated: string[] = [];
    for (const [ns, keys] of Object.entries(en as Catalogue)) {
      for (const [k, value] of Object.entries(keys)) {
        if (/^\{\{[^}]+\}\}$/.test(value)) continue;
        if ((hi as Catalogue)[ns]?.[k] === value) untranslated.push(`${ns}.${k}`);
      }
    }
    expect(untranslated).toEqual([]);
  });

  it('keeps every interpolation placeholder', () => {
    const mismatched: string[] = [];
    const vars = (s: string) => (s.match(/\{\{(\w+)\}\}/g) ?? []).sort().join(',');
    for (const [ns, keys] of Object.entries(en as Catalogue)) {
      for (const [k, value] of Object.entries(keys)) {
        if (vars(value) !== vars((hi as Catalogue)[ns]?.[k] ?? '')) mismatched.push(`${ns}.${k}`);
      }
    }
    expect(mismatched).toEqual([]);
  });
});
