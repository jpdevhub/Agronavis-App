import { LegalDocument } from '@/components/legal/LegalDocument';
import { LEGAL_UPDATED, PRIVACY_SECTIONS } from '@/features/legal/documents';

export default function PrivacyScreen() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updated={LEGAL_UPDATED}
      intro="What Agronavis collects, why, who else sees it, and how to have it deleted. We collect what the app needs to advise your fields and nothing for advertising, your field boundaries are treated as the most sensitive thing we hold, and your conversations with Sahayak never leave your phone."
      sections={PRIVACY_SECTIONS}
    />
  );
}
