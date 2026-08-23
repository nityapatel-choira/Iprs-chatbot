import { extractMessageText } from "../../../../store/slices/conversationSlice";
import RichText from "../../../../components/RichText/RichText";
import ConsentSheet from "../../../../components/ConsentSheet/ConsentSheet";

// The backend sends the consent step as a plain "choice input" (single "I
// Accept" item) with its title/body as trailing bot chat messages, not as
// fields on `input` - see Chat.jsx's isConsentAcceptStep/trailingBotMessages.
// Title and body arrive as two richText paragraph blocks in the same
// message, so the split happens at the block level: flatten every trailing
// message's richText into one list, then treat the first block as the
// title and the rest as the body (a single block renders entirely as
// body). Rendered via RichText straight from the backend's richText, so a
// link (e.g. the Privacy Notice) renders exactly as sent.
function ConsentDialog({ messages, onAccept, onBack }) {
  if (!messages || messages.length === 0) return null;

  const blocks = messages.flatMap((msg) => msg.richText || []);
  if (blocks.length === 0) return null;

  const [first, ...rest] = blocks;
  const hasSeparateTitle = rest.length > 0;
  const title = hasSeparateTitle ? extractMessageText({ richText: [first] }) : undefined;
  const bodyNodes = hasSeparateTitle ? rest : blocks;

  return (
    <ConsentSheet open title={title} onAccept={onAccept} onBack={onBack}>
      <RichText nodes={bodyNodes} />
    </ConsentSheet>
  );
}

export default ConsentDialog;
