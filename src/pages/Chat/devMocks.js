// Dev fixtures for testing UI cards.

function botText(text) {
  return { content: { richText: [{ type: "p", children: [{ text }] }] } };
}

function linkParagraph(before, linkText, linkHref, after) {
  return {
    type: "p",
    children: [{ text: before }, { type: "a", url: linkHref, children: [{ text: linkText }] }, { text: after }],
  };
}

function botParagraphs(paragraphs) {
  return { content: { richText: paragraphs } };
}

export const DEV_MOCK_INPUTS = {
  documentSummaryText: {
    messages: [
      botText(
        "Requirements for Author/Composer (Individual)\nIdentity Proof (Pan Card)\nBank Proof (Passbook front page/ Bank Statement/ Cancelled Cheque)\nPermanent Address Proof (Passport, Driving License, Voter ID, electricity Bill, Telephone Bill, Mobile Bill, letter from Owner)\nPresent Address Proof (Passport, Driving License, Voter ID, Registered Leave License Copy, electricity Bill, Telephone Bill, Mobile Bill, letter from Owner)\nGST Registration Certificate (If Applicable)\nIf an applicant is a member of another society, then the applicant needs to provide a copy of the NOC from that society.\nPassport size Photo applicant.\n\nAPPLICATION FEE: ₹1200\n\nNon Refundable"
      ),
    ],
    input: {
      id: "mock-document-summary-text",
      type: "choice input",
      items: [{ content: "Start Application" }, { content: "Change my previous answers" }],
    },
  },
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
    messages: [
      botParagraphs([
        {
          type: "p",
          children: [{ text: "Consent for collection and processing of your personal/sensitive personal data" }],
        },
        linkParagraph(
          "If you agree to our collection and processing of your personal data in accordance with the terms laid out in our ",
          "Privacy Notice",
          "https://membership.iprs.org/AppDocs/Privacy_Notice.pdf",
          ", please indicate your consent by clicking the 'I Accept' button. By clicking this button, you confirm that you have read, understood and consent to the Privacy Notice. You understand that without providing your personal data as required under the Privacy Notice, you will not be able to use/access the IPRS Membership Portal."
        ),
      ]),
    ],
    input: { id: "mock-consent-privacy", type: "choice input", items: [{ content: "I Accept" }] },
  },
  consentPrivacyWithDocRecap: {
    messages: [
      botText(
        "Requirements for Author/Composer (Individual): Identity Proof (PAN Card), Bank Proof, Permanent Address Proof, Present Address Proof, GST Registration Certificate (if applicable). Application Fee: ₹1,200 (non-refundable)."
      ),
      botParagraphs([
        {
          type: "p",
          children: [{ text: "Consent for collection and processing of your personal/sensitive personal data" }],
        },
        linkParagraph(
          "If you agree to our collection and processing of your personal data in accordance with the terms laid out in our ",
          "Privacy Notice",
          "https://membership.iprs.org/AppDocs/Privacy_Notice.pdf",
          ", please indicate your consent by clicking the 'I Accept' button."
        ),
      ]),
    ],
    input: { id: "mock-consent-privacy-recap", type: "choice input", items: [{ content: "I Accept" }] },
  },
  consentFraud: {
    messages: [
      botParagraphs([
        { type: "p", children: [{ text: "Please Note!" }] },
        {
          type: "p",
          children: [
            {
              text: "Members are cautioned that submitting fraudulent, falsified or misleading works data or members personal details is strictly prohibited and may result in termination of membership.",
            },
          ],
        },
      ]),
    ],
    input: { id: "mock-consent-fraud", type: "choice input", items: [{ content: "I Accept" }] },
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
  profilePhoto: {
    messages: [botText("Upload your Profile photo")],
    input: {
      id: "mock-profile-photo",
      type: "file input",
      options: { variableId: "vww01qa7jizgywxikfu1yu48x" },
    },
  },
  panCard: {
    messages: [botText("Upload your PAN card")],
    input: { id: "mock-pan-card", type: "file input", title: "Upload PAN Card", caption: "JPEG and PNG up to 2MB" },
  },
  aadhaar: {
    messages: [botText("Enter Aadhaar Number")],
    input: { id: "mock-aadhaar", type: "text input", placeholder: "Enter Aadhaar number" },
  },
  otp: {
    messages: [botText("We have shared an OTP with you for verification. Please share the OTP")],
    input: { id: "mock-otp", type: "otp input" },
  },
};
