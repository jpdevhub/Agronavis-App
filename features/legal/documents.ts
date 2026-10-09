import type { LegalSection } from '@/components/legal/LegalDocument';

/**
 * The legal documents, as data.
 *
 * Kept here rather than in the screens so the three read alike and so a clause
 * can be changed in one place. The root PRIVACY.md and SECURITY.md are the
 * same text for the website and the Play Store listing — when one changes, the
 * other has to, and the Play Store privacy URL must resolve to the same words
 * a farmer sees in the app.
 */
export const LEGAL_UPDATED = '9 October 2026';

/** Fill these in before publishing. Play Store rejects placeholder contacts. */
export const LEGAL_CONTACT = {
  company: '[Registered business name]',
  address: '[Registered address, India]',
  support: '[support@agronavis.example]',
  privacy: '[privacy@agronavis.example]',
  security: '[security@agronavis.example]',
  grievanceOfficer: '[Name of Grievance Officer]',
  grievanceEmail: '[grievance@agronavis.example]',
};

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: 'Who may use Agronavis',
    blocks: [
      {
        kind: 'text',
        text: 'You must be at least 18 years old and legally able to enter a contract in India. By creating an account you confirm that you are, and that everything you tell us about yourself and your land is true to the best of your knowledge.',
      },
      {
        kind: 'text',
        text: 'One account belongs to one person. Keep your password private. Anything done through your account is treated as done by you, so tell us immediately if you think someone else has access to it.',
      },
    ],
  },
  {
    heading: 'What Agronavis is — and what it is not',
    blocks: [
      {
        kind: 'text',
        text: 'Agronavis delivers public agricultural records to the field you map: soil nutrient surveys published by the Government of India, satellite rainfall and sunlight, mandi prices, crop schedules and a disease reading from a photograph.',
      },
      {
        kind: 'callout',
        title: 'This is information, not professional advice',
        text: 'Agronavis is not a substitute for a qualified agronomist, an agricultural extension officer, a soil testing laboratory or a plant pathologist. Every decision about sowing, irrigation, fertiliser, pesticide, harvest and sale remains yours.',
      },
      {
        kind: 'text',
        text: 'We are not a party to any sale of your produce and we do not buy, sell, broker or transport anything. We do not sell seeds, fertiliser, pesticide or equipment, and we are not an agent for anyone who does.',
      },
    ],
  },
  {
    heading: 'The limits of what we show you',
    blocks: [
      {
        kind: 'text',
        text: 'Please read this section carefully. It describes exactly how each figure in the app can be wrong.',
      },
      {
        kind: 'bullets',
        items: [
          'Soil readings come from the Soil Health Card scheme and describe samples tested across your district. They are not a test of your particular plot. The app shows how many samples a reading is based on so you can judge it.',
          'Weather and water requirement are calculated from satellite and forecast data using the FAO-56 method. They are estimates of conditions over your coordinates, not measurements taken in your field.',
          'The disease reading is produced by a machine learning model from a single photograph. It returns the most likely conditions with a confidence figure, and it can be wrong. Confirm against the reference library and, where the decision matters, against a person who can see the plant.',
          'Mandi prices are reported by the Agmarknet network and may be delayed, incomplete or missing for your commodity. They are indicative only and are not an offer, a quotation, or any assurance of the price you will receive.',
          'Crop lists and fertiliser guidance follow government scheme catalogues and are general to a state, not tailored to your soil, variety or season.',
        ],
      },
    ],
  },
  {
    heading: 'Using pesticides and fertilisers safely',
    blocks: [
      {
        kind: 'callout',
        title: 'Always follow the product label',
        text: 'The label approved under the Insecticides Act, 1968 and registered with the Central Insecticides Board & Registration Committee overrides anything shown in this app. Where they differ, follow the label.',
      },
      {
        kind: 'text',
        text: 'Use only products registered for your crop and your pest in India, observe the stated dose, waiting period and pre-harvest interval, and wear the protective equipment the label requires. Nothing in Agronavis authorises a use the label does not permit.',
      },
      {
        kind: 'text',
        text: 'If a person or animal is exposed to a pesticide, contact a doctor or poison control centre immediately and take the product label with you. Do not wait to consult the app.',
      },
    ],
  },
  {
    heading: 'Your responsibility for decisions',
    blocks: [
      {
        kind: 'text',
        text: 'Farming outcomes depend on weather, soil, seed, pests, labour, irrigation, market conditions and many things no application can see. You accept that you are responsible for the decisions you take on your land, including those informed by Agronavis.',
      },
      {
        kind: 'text',
        text: 'Where a decision carries significant cost or risk — a large input purchase, treating a whole field, or timing a sale — we recommend confirming with your local extension officer or an agronomist before acting.',
      },
    ],
  },
  {
    heading: 'What you post',
    blocks: [
      {
        kind: 'text',
        text: 'Community posts and replies are visible to other farmers. You keep ownership of what you write and the photographs you upload, and you grant us permission to store and display them within Agronavis so the feature works.',
      },
      {
        kind: 'text',
        text: 'Do not post anything unlawful, misleading, abusive, obscene, infringing, or that impersonates another person. Do not post advice that would breach pesticide regulation, and do not use the community to advertise or solicit.',
      },
      {
        kind: 'text',
        text: 'We may remove content that breaches these terms or the law, and may suspend an account that does so repeatedly.',
      },
    ],
  },
  {
    heading: 'Acceptable use of the service',
    blocks: [
      {
        kind: 'bullets',
        items: [
          'Do not attempt to access another farmer’s account, fields or records.',
          'Do not scrape, bulk-download or resell the data the app provides.',
          'Do not reverse engineer, decompile or tamper with the application or our servers.',
          'Do not use automated systems to create accounts or submit requests at volume.',
          'Do not use Agronavis for anything unlawful.',
        ],
      },
    ],
  },
  {
    heading: 'Our intellectual property',
    blocks: [
      {
        kind: 'text',
        text: 'The application, its design, its source code and the models it runs belong to us. Government datasets and open models remain the property of their publishers and are used under their own terms. Nothing here transfers any ownership to you; you receive a personal, non-transferable permission to use the app.',
      },
    ],
  },
  {
    heading: 'Availability',
    blocks: [
      {
        kind: 'text',
        text: 'We work to keep Agronavis available but we do not guarantee it. The service depends on third parties — hosting, satellite data, weather services and the mandi reporting network — any of which may be delayed or unavailable. Features may change or be withdrawn.',
      },
    ],
  },
  {
    heading: 'Limitation of liability',
    blocks: [
      {
        kind: 'text',
        text: 'To the fullest extent permitted by Indian law, we are not liable for crop loss, yield reduction, input cost, lost profit, lost sale price, or any indirect or consequential loss arising from your use of Agronavis or from reliance on anything it shows you.',
      },
      {
        kind: 'text',
        text: 'Nothing in these terms limits liability that cannot be limited by law, including liability for fraud or for death or personal injury caused by negligence.',
      },
    ],
  },
  {
    heading: 'Ending your use',
    blocks: [
      {
        kind: 'text',
        text: 'You may delete your account at any time from Profile, then Security. Deletion removes your profile, farms, fields, scans, tasks, advisories and community posts, and cannot be undone.',
      },
      {
        kind: 'text',
        text: 'We may suspend or close an account that breaches these terms, that is used unlawfully, or where we are required to by law.',
      },
    ],
  },
  {
    heading: 'Grievance redressal',
    blocks: [
      {
        kind: 'text',
        text: `In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, complaints about content or about your use of Agronavis may be sent to our Grievance Officer: ${LEGAL_CONTACT.grievanceOfficer}, ${LEGAL_CONTACT.grievanceEmail}, ${LEGAL_CONTACT.address}.`,
      },
      {
        kind: 'text',
        text: 'We acknowledge a complaint within 24 hours of receiving it and work to resolve it within 15 days.',
      },
    ],
  },
  {
    heading: 'Governing law',
    blocks: [
      {
        kind: 'text',
        text: 'These terms are governed by the laws of India, and the courts at [city of registered office] have exclusive jurisdiction over any dispute.',
      },
    ],
  },
  {
    heading: 'Changes to these terms',
    blocks: [
      {
        kind: 'text',
        text: 'We may update these terms. Material changes will be shown in the app before they take effect, and the date at the top of this page will change. Continuing to use Agronavis after that means you accept the updated terms.',
      },
      {
        kind: 'text',
        text: `Questions about these terms: ${LEGAL_CONTACT.support}`,
      },
    ],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: 'What we collect',
    blocks: [
      { kind: 'text', text: 'You give us: your email address, name, an optional phone number and photograph, your village, district and state, your preferred language, and details of how you farm — irrigation type, soil type and the crops you grow.' },
      { kind: 'text', text: 'The app records as you use it: the boundaries you draw and the area calculated from them, the names and dates of crops you plant, tasks you complete, photographs you scan, posts you write, and a notification token for your device.' },
      { kind: 'text', text: 'Your device location is read only when you tap the locate button while mapping a field. We do not track your location in the background.' },
      { kind: 'callout', title: 'Field boundaries are sensitive', text: 'A field boundary is the precise location of someone’s livelihood. We treat it as the most sensitive thing we hold, and it is never shared with advertisers or sold to anyone.' },
      { kind: 'text', text: 'We do not collect your contacts, call logs, SMS, installed applications, browsing history or advertising identifiers.' },
    ],
  },
  {
    heading: 'Your conversations stay on your phone',
    blocks: [
      { kind: 'text', text: 'Sahayak runs a language model on your device. What you ask it, and what it answers, is processed on the handset and never sent to us or to anyone else. The farm details it reads to answer usefully are held in a copy on the phone.' },
      { kind: 'text', text: 'Speech recognition and speech output use your device’s own services, governed by your phone’s settings rather than by us.' },
    ],
  },
  {
    heading: 'Why we process it, and your consent',
    blocks: [
      { kind: 'text', text: 'Under the Digital Personal Data Protection Act, 2023 we process your data to provide the service you have asked for, and on your consent for optional items such as location and notifications.' },
      { kind: 'text', text: 'You may withdraw consent at any time in your device settings or by deleting your account, though features that depend on it will stop working.' },
    ],
  },
  {
    heading: 'Who else receives anything',
    blocks: [
      { kind: 'text', text: 'We do not sell your data and we do not share it with advertisers. Each party below receives only what it needs:' },
      {
        kind: 'bullets',
        items: [
          'Supabase — our database, sign-in and file storage; holds everything we store.',
          'Render — runs our API and processes your requests.',
          'NASA POWER — receives a field’s coordinates, to return rainfall and sunlight.',
          'OpenWeatherMap — receives a field’s coordinates, to return conditions and forecast.',
          'Mapbox — receives the map area you are viewing, to return satellite imagery.',
          'OpenStreetMap Nominatim — receives a field’s coordinates, to return a district name.',
          'Expo push service — receives your device token and the alert text, to deliver notifications.',
        ],
      },
      { kind: 'text', text: 'The weather, map and geocoding services receive coordinates with nothing identifying you attached. Agmarknet, the Soil Health Card scheme and the fertiliser scheme receive nothing — we read their published data on a schedule.' },
    ],
  },
  {
    heading: 'How long we keep it',
    blocks: [
      { kind: 'text', text: 'Your account, profile, farms, fields, scans and posts are kept while your account exists. Server logs are kept for 30 days.' },
    ],
  },
  {
    heading: 'Deleting your account',
    blocks: [
      { kind: 'text', text: 'Open Profile, then Security, and choose to delete your account. This removes your profile, farms and fields, scans and their photographs, tasks, advisories and community posts. It is immediate and cannot be undone.' },
      { kind: 'text', text: 'Cached public data such as district soil records and mandi prices is not personal to you and remains.' },
    ],
  },
  {
    heading: 'Your rights',
    blocks: [
      { kind: 'bullets', items: ['See everything we hold about you', 'Correct anything that is wrong', 'Delete your account and its data', 'Receive your data in a machine-readable form', 'Object to a particular use', 'Nominate someone to exercise these rights if you are unable to'] },
      { kind: 'text', text: `Write to ${LEGAL_CONTACT.privacy}. We reply within 30 days. If you are not satisfied you may complain to the Data Protection Board of India.` },
    ],
  },
  {
    heading: 'Children',
    blocks: [
      { kind: 'text', text: 'Agronavis is for adults who farm. We do not knowingly collect data from anyone under 18. If you believe a child has given us data, write to us and we will remove it.' },
    ],
  },
  {
    heading: 'Changes and contact',
    blocks: [
      { kind: 'text', text: 'Material changes will be announced in the app before they take effect, and the date at the top of this page will change.' },
      { kind: 'text', text: `${LEGAL_CONTACT.company} · ${LEGAL_CONTACT.address} · ${LEGAL_CONTACT.privacy}` },
    ],
  },
];

export const SECURITY_SECTIONS: LegalSection[] = [
  {
    heading: 'How your data is protected',
    blocks: [
      { kind: 'text', text: 'The app never connects to our database. Every read and write goes through our API, which is the only holder of the database master key and the third-party keys. Only values that are safe to publish are compiled into the app itself.' },
      { kind: 'text', text: 'Your access token is verified on every request, and the API checks that you own a record before it answers. Row Level Security on the database is a second line of defence behind that check.' },
      { kind: 'text', text: 'Two-factor authentication is available in Profile, then Security. Its secret is encrypted before it is stored, never kept in plain text.' },
      { kind: 'text', text: 'Traffic between the app and our servers is encrypted in transit.' },
    ],
  },
  {
    heading: 'What you can do',
    blocks: [
      { kind: 'bullets', items: ['Use a password you do not use anywhere else', 'Turn on two-factor authentication', 'Lock your phone with a PIN, pattern or biometric', 'Sign out on a device you no longer use', 'Never share a verification code with anyone, including someone claiming to be from Agronavis'] },
      { kind: 'callout', title: 'We will never ask for your password', text: 'No one from Agronavis will ever ask for your password or a two-factor code, by phone, message or email. Anyone who does is attempting fraud.' },
    ],
  },
  {
    heading: 'Reporting a vulnerability',
    blocks: [
      { kind: 'text', text: `If you find a security problem, please report it privately to ${LEGAL_CONTACT.security} rather than posting it publicly. Tell us what the problem is, how to reproduce it, and what an attacker could do with it.` },
      { kind: 'text', text: 'You will get an acknowledgement within 3 working days and an assessment within 10. We will credit you by name unless you would rather we did not, and we will not pursue action against anyone who reports in good faith without accessing or destroying other people’s data.' },
    ],
  },
  {
    heading: 'If something goes wrong',
    blocks: [
      { kind: 'text', text: 'No system is perfectly secure. If a breach affects your personal data we will inform you and the Data Protection Board of India as the Digital Personal Data Protection Act, 2023 requires.' },
    ],
  },
];
