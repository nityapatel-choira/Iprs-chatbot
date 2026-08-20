// Dev-only fixtures for visually QA-ing the dormant Figma cards that the
// live backend doesn't send yet (checkbox/summary/consent/declaration/
// document input, plus the verified-field chip). Never imported outside
// useBackendConversation's `import.meta.env.DEV` branch, so this - and the
// content below, borrowed for copy only from the old mock's STEPS/CONSENT -
// is stripped from the production bundle. Activate with
// `?mockInput=<key>` while running `npm run dev`.

function botText(text) {
  return { content: { richText: [{ type: "p", children: [{ text }] }] } };
}

export const DEV_MOCK_INPUTS = {
  checkbox: {
    messages: [botText("What's your part in the music?")],
    input: {
      id: "mock-checkbox",
      type: "checkbox input",
      caption: "Tick everything - many people tick more than one",
      options: [
        { key: "lyrics", label: "I write the lyrics" },
        { key: "music", label: "I compose the music" },
      ],
    },
  },
  summary: {
    messages: [],
    input: {
      id: "mock-summary",
      type: "summary input",
      data: {
        entityLabel: "Author/Composer (Individual)",
        fee: "₹1,200",
        feeCaption: "Total application fee",
        infoText: "The application fee will only be refundable in case your application gets rejected by IPRS",
        docsHeading: "You'll need these 6 documents",
        docsSubtext: "Make sure before you start you have gathered the below mentioned documents.",
        docs: [
          { label: "Identity Proof (PAN Card)" },
          { label: "Bank Proof", subtext: "Passbook front page/ Bank Statement/ Cancelled Cheque" },
          { label: "Permanent Address Proof", subtext: "Passport/ Driving License/ Voter ID/ Electricity Bill" },
          { label: "Present Address Proof", subtext: "Passport/ Driving License/ Voter ID/ Electricity Bill" },
          { label: "GST Registration Certificate" },
          { label: "Copy of the NOC from another society" },
        ],
        options: [
          { label: "Start Application", primary: true },
          { label: "Change my previous answers", primary: false },
        ],
      },
    },
  },
  summaryConfirm: {
    messages: [],
    input: {
      id: "mock-summary-confirm",
      type: "summary input",
      data: {
        entityLabel: "Owner Publisher",
        fee: "₹2,200",
        feeCaption: "Total application fee",
        infoText: "The application fee is non refundable",
        confirmLabel: "I have read the above & confirm the information I'm submitting is true and accurate.",
      },
    },
  },
  consentPrivacy: {
    messages: [],
    input: { id: "mock-consent-privacy", type: "consent input", sheet: "privacy" },
  },
  consentFraud: {
    messages: [],
    input: { id: "mock-consent-fraud", type: "consent input", sheet: "fraud" },
  },
  declaration: {
    messages: [botText("Two more things before we make your profile")],
    input: {
      id: "mock-declaration",
      type: "declaration input",
      title: "Two more things",
      options: [
        { key: "gst", label: "I have registered GST" },
        { key: "society", label: "I am a member of another society" },
      ],
    },
  },
  document: {
    messages: [botText("Let's scan your PAN card.")],
    input: {
      id: "mock-document",
      type: "document input",
      title: "Position your document within the frame",
      caption: "Make sure the card is well-lit and all details are visible",
    },
  },
  passportPhoto: {
    messages: [botText("Now let's get your passport size photo.")],
    input: {
      id: "mock-passport-photo",
      type: "file input",
      title: "Passport Size Photo",
      caption: "Scan your face or upload a clear passport size photo",
    },
  },
  aadhaar: {
    messages: [botText("Enter Aadhaar Number")],
    input: { id: "mock-aadhaar", type: "text input", placeholder: "Enter Aadhaar number" },
  },
  otp: {
    messages: [botText("We have shared an OTP with you for verification. Please share the OTP")],
    input: { id: "mock-otp", type: "otp input" },
  },
  payment: {
    messages: [botText("Last step - pay the membership fee to complete your registration.")],
    input: {
      id: "mock-payment",
      type: "payment input",
      amount: 120000,
      prefillName: "Test User",
      prefillEmail: "test@example.com",
      prefillContact: "9999999999",
    },
  },
};
