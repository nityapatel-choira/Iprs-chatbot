import { extractMessageText } from "../../../../store/slices/conversationSlice";
import RichText from "../../../../components/RichText/RichText";
import ConsentSheet from "../../../../components/ConsentSheet/ConsentSheet";

// The backend sends the consent step as a plain "choice input" (single "I
// Accept" item) with its title/body as the trailing bot chat messages, not
// as fields on `input` - see Chat.jsx's isConsentAcceptStep/trailingBotMessages.
// Title and body arrive as two richText paragraph blocks within the same
// message (not as two separate messages), so the split has to happen at
// the block level - flattening every trailing message's richText into one
// ordered list first, then treating the first block as the title (a short
// lead-in, same convention every other multi-part step uses) and the rest
// as the body. This still works unchanged if the backend ever does send
// them as separate messages instead. A single block total has no separate
// title and renders entirely as body. Either way the body is rendered via
// RichText straight from the backend's richText, so a link (e.g. the
// Privacy Notice) renders exactly as sent - nothing here is hardcoded.
function ConsentDialog({ messages, onAccept }) {
  if (!messages || messages.length === 0) return null;

  const blocks = messages.flatMap((msg) => msg.richText || []);
  if (blocks.length === 0) return null;

  const [first, ...rest] = blocks;
  const hasSeparateTitle = rest.length > 0;
  const title = hasSeparateTitle ? extractMessageText({ richText: [first] }) : undefined;
  const bodyNodes = hasSeparateTitle ? rest : blocks;

  return (
    <ConsentSheet open title={title} onAccept={onAccept}>
      <RichText nodes={bodyNodes} />
    </ConsentSheet>
  );
}

export default ConsentDialog;
