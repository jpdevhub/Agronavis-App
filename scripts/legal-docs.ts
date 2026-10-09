/**
 * Writes the root legal markdown from the same content the app renders.
 *
 * The Play Store needs a privacy policy at a public URL, and that page must say
 * what the farmer saw before agreeing in the app. Two hand-maintained copies
 * drift, and a privacy policy that contradicts itself is worse than one that is
 * merely short — so the app's content is the source and these files are built
 * from it. Run `npm run legal` after changing features/legal/documents.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { LegalSection } from '../components/legal/LegalDocument';
import {
  LEGAL_CONTACT,
  LEGAL_UPDATED,
  PRIVACY_SECTIONS,
  TERMS_SECTIONS,
} from '../features/legal/documents';

const ROOT = path.join(__dirname, '..');

function render(title: string, intro: string, sections: LegalSection[]): string {
  const out: string[] = [
    `# ${title}`,
    '',
    `**Last updated: ${LEGAL_UPDATED}**`,
    '',
    '<!-- Generated from features/legal/documents.ts by `npm run legal`.',
    '     Edit that file, not this one — the app renders the same content. -->',
    '',
    intro,
    '',
  ];

  sections.forEach((section, i) => {
    out.push(`## ${i + 1}. ${section.heading}`, '');
    for (const block of section.blocks) {
      if (block.kind === 'text') out.push(block.text, '');
      else if (block.kind === 'bullets') {
        out.push(...block.items.map((b) => `- ${b}`), '');
      } else {
        out.push(`> **${block.title}**`, '>', `> ${block.text}`, '');
      }
    }
  });

  out.push('---', '', `${LEGAL_CONTACT.company} · ${LEGAL_CONTACT.address}`);
  return out.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

const files: [string, string][] = [
  [
    'TERMS.md',
    render(
      'Terms and Conditions',
      'These terms govern your use of Agronavis. The sections on what the app can and cannot tell you, and on using pesticides safely, are the ones that affect your field.',
      TERMS_SECTIONS,
    ),
  ],
  [
    'PRIVACY.md',
    render(
      'Privacy Policy',
      'What Agronavis collects, why, who else sees it, and how to have it deleted. We collect what the app needs to advise your fields and nothing for advertising, your field boundaries are treated as the most sensitive thing we hold, and your conversations with Sahayak never leave your phone.',
      PRIVACY_SECTIONS,
    ),
  ],
];

for (const [name, body] of files) {
  fs.writeFileSync(path.join(ROOT, name), body);
  console.log(`wrote ${name} (${body.split('\n').length} lines)`);
}
