import ConsentSheet from "../../../../components/ConsentSheet/ConsentSheet";
import { CONSENT } from "../../conversationFlow";

function ConsentDialog({ sheet, onAccept, onBack }) {
  if (!sheet || !CONSENT[sheet]) return null;

  return (
    <ConsentSheet open title={CONSENT[sheet].title} onAccept={onAccept} onBack={onBack}>
      {sheet === "privacy" ? (
        <p>
          {CONSENT.privacy.bodyBefore}
          <a href={CONSENT.privacy.linkHref} target="_blank" rel="noreferrer">
            {CONSENT.privacy.linkText}
          </a>
          {CONSENT.privacy.bodyAfter}
        </p>
      ) : (
        <p>{CONSENT.fraud.body}</p>
      )}
    </ConsentSheet>
  );
}

export default ConsentDialog;
