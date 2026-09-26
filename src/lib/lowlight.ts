import { createElement, type ReactNode } from "react";
import { common, createLowlight } from "lowlight";
import type { Root, RootContent } from "hast";

// Shared between the editor (CodeBlockLowlight) and the public renderer so
// both detect languages and colour tokens the same way.
export const lowlight = createLowlight(common);

export function highlightCode(code: string, language?: string | null): Root {
  if (language && lowlight.registered(language)) {
    return lowlight.highlight(language, code);
  }
  return lowlight.highlightAuto(code);
}

// Lowlight only emits <span class="hljs-*"> elements and text, so a tiny
// converter is enough to turn its tree into React nodes.
export function hastToReact(nodes: RootContent[], keyPrefix = "h"): ReactNode[] {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    if (node.type === "text") return node.value;
    if (node.type === "element") {
      const className = node.properties?.className;
      return createElement(
        node.tagName,
        {
          key,
          className: Array.isArray(className) ? className.join(" ") : undefined,
        },
        ...hastToReact(node.children, key),
      );
    }
    return null;
  });
}
