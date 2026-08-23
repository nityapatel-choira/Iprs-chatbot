const BLOCK_TAGS = {
  p: "p",
  ol: "ol",
  ul: "ul",
  li: "li",
  h1: "h1",
  h2: "h2",
  h3: "h3",
};

function RichTextLeaf({ node, index }) {
  let content = node.text ?? "";
  if (node.bold) content = <strong>{content}</strong>;
  if (node.italic) content = <em>{content}</em>;
  if (node.underline) content = <u>{content}</u>;

  if (node.url) {
    return (
      <a key={index} href={node.url} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return <span key={index}>{content}</span>;
}

function RichTextNode({ node, index }) {
  if (node == null) return null;

  if (typeof node.text === "string" && !node.children) {
    return <RichTextLeaf node={node} index={index} />;
  }

  const children = Array.isArray(node.children)
    ? node.children.map((child, i) => <RichTextNode key={i} node={child} index={i} />)
    : null;

  if (node.type === "a" && node.url) {
    return (
      <a key={index} href={node.url} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  const Tag = BLOCK_TAGS[node.type] || "span";
  return <Tag key={index}>{children}</Tag>;
}

const RichText = ({ nodes }) => {
  if (typeof nodes === "string") return <p>{nodes}</p>;
  if (!Array.isArray(nodes)) return null;

  return (
    <>
      {nodes.map((node, index) => (
        <RichTextNode key={index} node={node} index={index} />
      ))}
    </>
  );
};

export default RichText;
