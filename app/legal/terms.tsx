import { LegalDocument } from '@/components/legal/LegalDocument';
import { LEGAL_UPDATED, TERMS_SECTIONS } from '@/features/legal/documents';

export default function TermsScreen() {
  return (
    <LegalDocument
      title="Terms and Conditions"
      updated={LEGAL_UPDATED}
      intro="These terms govern your use of Agronavis. The sections on what the app can and cannot tell you, and on using pesticides safely, are the ones that affect your field — please read those even if you read nothing else."
      sections={TERMS_SECTIONS}
    />
  );
}
