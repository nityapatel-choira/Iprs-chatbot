import { extractMessageText } from "../../../../store/slices/conversationSlice";
import RichText from "../../../../components/RichText/RichText";
import ConsentSheet from "../../../../components/ConsentSheet/ConsentSheet";

// Formats richText consent blocks into modal title and body.
const ConsentDialog = ({ messages, onAccept, onBack }) => {
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
};

export default ConsentDialog;
