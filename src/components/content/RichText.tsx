// Server-only rendering for rich text written in the admin Tiptap editor
// (blog posts, project case studies): sanitise, then parse to React with
// syntax-highlighted code blocks. Nothing here ships to the browser.
import parse, {
  Element,
  Text,
  type DOMNode,
  type HTMLReactParserOptions,
} from "html-react-parser";
import sanitizeHtml from "sanitize-html";
import { hastToReact, highlightCode } from "@/lib/lowlight";
import CodeBlock from "@/components/blog/CodeBlock";

const ALLOWED_TAGS = [
  "b", "i", "em", "strong", "a", "p", "ul", "ol", "li",
  "img", "iframe", "h1", "h2", "h3", "h4", "h5", "h6",
  "br", "blockquote", "code", "pre", "u", "s", "sub", "sup",
  "hr", "table", "thead", "tbody", "tr", "th", "td",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "width", "height",
  "allowfullscreen", "target", "rel", "class", "style", "id",
];

export function sanitizeRichText(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { "*": ALLOWED_ATTR },
  });
}

function getText(nodes: DOMNode[]): string {
  return nodes
    .map((node) =>
      node instanceof Text
        ? node.data
        : node instanceof Element
          ? getText(node.children as DOMNode[])
          : "",
    )
    .join("");
}

// Colour <pre><code> blocks the same way the editor does
const parserOptions: HTMLReactParserOptions = {
  replace(domNode) {
    if (!(domNode instanceof Element)) return;

    // React holds a navigation's commit until eager <img>s load, which swaps in
    // the route loader and drops the card -> post view transition. Lazy images
    // are exempt, and they're below the hero anyway.
    if (domNode.name === "img") {
      domNode.attribs.loading = "lazy";
      domNode.attribs.decoding = "async";
      return;
    }

    if (domNode.name !== "pre") return;
    const code = domNode.children.find(
      (child): child is Element =>
        child instanceof Element && child.name === "code",
    );
    if (!code) return;

    const language = code.attribs.class?.match(/language-([\w-]+)/)?.[1];
    const text = getText(code.children as DOMNode[]);
    const tree = highlightCode(text, language);

    return (
      <CodeBlock code={text} language={language}>
        {hastToReact(tree.children)}
      </CodeBlock>
    );
  },
};

// Expects HTML that already went through sanitizeRichText
export const renderRichText = (html: string) => parse(html, parserOptions);
