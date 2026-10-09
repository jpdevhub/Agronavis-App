import { LegalDocument } from '@/components/legal/LegalDocument';
import { LEGAL_UPDATED, SECURITY_SECTIONS } from '@/features/legal/documents';

export default function SecurityPolicyScreen() {
  return (
    <LegalDocument
      title="Security"
      updated={LEGAL_UPDATED}
      intro="How your account and your farm records are protected, what you can do to keep them safe, and how to tell us if you find a problem."
      sections={SECURITY_SECTIONS}
    />
  );
}
