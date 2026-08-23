import { extractMessageText } from "../../../../store/slices/conversationSlice";
import RichText from "../../../../components/RichText/RichText";
import ConsentSheet from "../../../../components/ConsentSheet/ConsentSheet";

// Backend sends consent as trailing bot messages, not fields on `input` -
// see Chat.jsx's isConsentAcceptStep. Title+body are two richText blocks in
// one message; the first block is the title, the rest is the body.
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
