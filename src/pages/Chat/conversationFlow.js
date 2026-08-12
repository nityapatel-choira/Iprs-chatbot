export const CONSENT = {
  privacy: {
    title: "Consent for collection and processing of your personal/sensitive personal data",
    bodyBefore:
      "If you agree to our collection and processing of your personal/sensitive personal data in accordance with the terms laid out in our ",
    linkText: "Privacy Notice",
    linkHref: "https://membership.iprs.org/AppDocs/Privacy_Notice.pdf",
    bodyAfter:
      ", please indicate your consent by clicking the 'I Accept' button. By this button, you confirm that you have read, understood and consent to the Privacy Notice. You understand that without providing your personal data as required under the Privacy Notice, you will not be able to use/access the IPRS Membership Portal.",
  },
  fraud: {
    title: "Please Note!",
    body:
      "Members are cautioned that submitting fraudulent, falsified or misleading works data or members personal details (misleading names / pseudonyms) is strictly prohibited. Fraudulent data or profile submissions undermine the integrity of the Society's records, harms fellow creators and will not be accepted and tolerated. Fraudulent / misleading data submissions also constitute a serious breach of trust and may result in legal and disciplinary consequences, including but not limited to: (a) Termination of membership as per the Society's Rules and Constitution (b) Forfeiture of royalties, benefits and recoveries (c) Legal action under applicable copyright and other applicable laws.",
  },
};

export const TRACKER_STAGES = ["Personal Details", "Bank Details", "Work Notifications", "Declaration"];

export const STEPS = {
  start: {
    bot: [
      "Hello! I am your IPRS assistant.",
      "I help musicians join IPRS so you get paid when your songs are played. Do you want to become an IPRS member?",
    ],
    input: {
      type: "quickReply",
      options: [
        { label: "Yes, I want to become a member", next: "role" },
        { label: "I have few questions first", next: "questions" },
      ],
    },
  },
  questions: {
    bot: [
      "Sure — ask away any time. Whenever you're ready, tap below and I'll guide you through membership in a few quick steps.",
    ],
    input: {
      type: "quickReply",
      options: [{ label: "Yes, I want to become a member", next: "role" }],
    },
  },
  role: {
    bot: [
      "Great! Five quick questions and I'll tell you your application fees & the required documents you'll need to become a member.",
      "Are you joining as an individual creator or a company/publisher?",
    ],
    input: {
      type: "quickReply",
      options: [
        {
          label: "Individual Creator",
          subtext: "I write and compose lyrics, tune, melody or score of songs",
          next: "residency",
        },
        {
          label: "Company/Publisher",
          subtext: "I release music under my own company and I own/control the rights",
          next: "residency",
        },
      ],
    },
  },
  residency: {
    bot: ["Do you live and pay tax in India or outside?"],
    input: {
      type: "quickReply",
      options: [
        { label: "India", next: "role2" },
        { label: "Outside India", subtext: "You're an NRI or overseas resident", next: "role2" },
      ],
    },
  },
  role2: {
    bot: ["What's your part in the music?"],
    input: {
      type: "checkbox",
      options: [
        { key: "lyrics", label: "I write the lyrics" },
        { key: "music", label: "I compose the music" },
      ],
      caption: "Tick everything - many people tick more than one",
      next: "gst",
    },
  },
  gst: {
    bot: ["Do you have a registered GST?"],
    input: { type: "yesNo", next: "society" },
  },
  society: {
    bot: ["Are you a member of another society?"],
    input: { type: "yesNo", next: "summary" },
  },
  summary: {
    bot: [],
    input: {
      type: "summary",
      data: {
        entityLabel: "Author/Composer (Individual)",
        fee: "₹1,200",
        feeCaption: "Total application fee",
        infoText: "The application fee will be only be refundable in case your application gets rejected by IPRS",
        docsHeading: "You'll need these 6 documents",
        docsSubtext: "Make sure before you start you have gathered the below mentioned documents.",
        docs: [
          { label: "Identity Proof (PAN Card)" },
          { label: "Bank Proof", subtext: "Passbook front page/ Bank Statement/ Cancelled Cheque" },
          {
            label: "Permanent Address Proof",
            subtext:
              "Passport/ Driving License/ Voter ID/ Electricity Bill/ Telephone Bill/ Mobile Bill/ Letter from Owner",
          },
          {
            label: "Present Address Proof",
            subtext:
              "Passport/ Driving License/ Voter ID/ Registered Leave License Copy/ Electricity Bill/Telephone Bill/ Mobile Bill/ Letter from Owner",
          },
          { label: "GST Registration Certificate" },
          { label: "Copy of the NOC from another society" },
        ],
      },
      options: [
        { label: "Start Application", next: "consentPrivacy" },
        { label: "Change my previous answers", next: "role" },
      ],
    },
  },
  consentPrivacy: {
    bot: [],
    tracker: { activeIndex: 0 },
    input: { type: "consent", sheet: "privacy", next: "consentFraud" },
  },
  consentFraud: {
    bot: [],
    tracker: { activeIndex: 0 },
    input: { type: "consent", sheet: "fraud", next: "docChoice" },
  },
  docChoice: {
    bot: [
      "Now for your personal details",
      "DigiLocker gives me your PAN, name, date of birth, photo AND address — all verified by the government. Nothing to type, nothing extra to upload.",
    ],
    tracker: { activeIndex: 0 },
    input: {
      type: "quickReply",
      options: [
        { label: "Fetch documents from DigiLocker", next: "digilocker" },
        { label: "Upload documents manually", next: "uploadManual" },
      ],
    },
  },
  digilocker: {
    bot: ["Redirecting you to DigiLocker to fetch your verified documents securely..."],
    tracker: { activeIndex: 0 },
    input: { type: "quickReply", options: [{ label: "Continue", next: "mobile" }] },
  },
  uploadManual: {
    bot: ["No problem.", "Upload your PAN card."],
    tracker: { activeIndex: 0 },
    input: {
      type: "fileUpload",
      title: "Upload PAN Card",
      caption: "JPEG and PDF up to 2MB",
      next: "mobile",
    },
  },
  mobile: {
    bot: ["Share your mobile number for your \naccount creation"],
    tracker: { activeIndex: 0 },
    input: { type: "text", placeholder: "Enter mobile number", inputMode: "numeric", next: "otp" },
  },
  otp: {
    bot: ["We have shared an OTP with you for verification. Please share the OTP"],
    tracker: { activeIndex: 0 },
    input: { type: "text", placeholder: "Enter OTP", inputMode: "numeric", next: "email" },
  },
  email: {
    bot: ["Share your email address"],
    tracker: { activeIndex: 0 },
    input: { type: "text", placeholder: "Enter email address", inputMode: "email", next: "done" },
  },
  done: {
    bot: ["Thank you! Your account is set up — I'll let you know here once your membership review is complete."],
    tracker: { activeIndex: 1 },
    input: null,
  },
};

export function summarizeCheckboxSelection(selected) {
  const keys = selected.map((opt) => opt.key);
  if (keys.includes("lyrics") && keys.includes("music")) return "I write lyrics and compose the music.";
  if (keys.includes("lyrics")) return "I write lyrics.";
  if (keys.includes("music")) return "I compose the music.";
  return selected.map((opt) => opt.label).join(", ");
}
