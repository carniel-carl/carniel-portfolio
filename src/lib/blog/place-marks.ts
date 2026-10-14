"use client";

// "You stopped here" marks on blog posts, one per post, kept in this browser
// only. A mark stores the marked words plus a little context either side (a
// text-quote anchor), so it still lands on the right words after the post is
// edited; the character offset only breaks ties and is the fallback when the
// words are gone. Storage can be blocked (private mode, previews), so every
// access is guarded and marks fall back to memory for the session.

const KEY = "blog-place-marks:v1";
const HINT_KEY = "blog-place-hint:v1";
const MAX_MARKS = 60;
const CONTEXT = 32;
// A passage longer than this is cut back to its first words
const MAX_QUOTE = 280;

export type PlaceMark = {
  quote: string;
  prefix: string;
  suffix: string;
  offset: number;
  savedAt: number;
};

type Store = Record<string, PlaceMark>;

let memory: Store = {};
let memoryHintSeen = false;

function isMark(value: unknown): value is PlaceMark {
  const m = value as PlaceMark | null;
  return (
    !!m &&
    typeof m.quote === "string" &&
    m.quote.length > 0 &&
    typeof m.prefix === "string" &&
    typeof m.suffix === "string" &&
    typeof m.offset === "number" &&
    typeof m.savedAt === "number"
  );
}

function readAll(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : {};
    return value && typeof value === "object" ? value : {};
  } catch {
    return memory;
  }
}

function writeAll(next: Store) {
  memory = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Memory only for this session
  }
}

export function getMark(slug: string): PlaceMark | null {
  const mark = readAll()[slug];
  return isMark(mark) ? mark : null;
}

export function saveMark(slug: string, mark: PlaceMark) {
  const next = { ...readAll(), [slug]: mark };
  // Forget the oldest marks first
  const slugs = Object.keys(next).sort((a, b) => (next[a]?.savedAt ?? 0) - (next[b]?.savedAt ?? 0));
  for (const old of slugs.slice(0, Math.max(0, slugs.length - MAX_MARKS))) delete next[old];
  writeAll(next);
}

export function clearMark(slug: string) {
  const next = { ...readAll() };
  delete next[slug];
  writeAll(next);
}

export function hintSeen() {
  try {
    return localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return memoryHintSeen;
  }
}

export function setHintSeen() {
  memoryHintSeen = true;
  try {
    localStorage.setItem(HINT_KEY, "1");
  } catch {}
}

// HDR: TEXT INDEX
// The article's markable text as one string, with the text node each
// character came from. Code blocks and control labels (copy buttons, the
// marker's own UI) aren't prose, so they're left out.
const SKIP = "pre, button, script, style, [aria-hidden='true'], [data-place-skip]";

type TextIndex = { text: string; nodes: Text[]; starts: number[] };

function indexText(root: HTMLElement): TextIndex {
  const nodes: Text[] = [];
  const starts: number[] = [];
  let text = "";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    nodes.push(node as Text);
    starts.push(text.length);
    text += (node as Text).data;
  }
  return { text, nodes, starts };
}

export function isMarkableNode(root: HTMLElement, node: Node) {
  return (
    node.nodeType === Node.TEXT_NODE &&
    root.contains(node) &&
    !node.parentElement?.closest(SKIP)
  );
}

function toIndex(idx: TextIndex, container: Node, offset: number) {
  if (container.nodeType === Node.TEXT_NODE) {
    const i = idx.nodes.indexOf(container as Text);
    if (i !== -1) return idx.starts[i] + offset;
  }
  // An element boundary (or skipped text): the first indexed text after it
  const point = document.createRange();
  point.setStart(container, offset);
  for (let i = 0; i < idx.nodes.length; i++) {
    const node = idx.nodes[i];
    if (point.comparePoint(node, node.length) >= 0) {
      return point.comparePoint(node, 0) >= 0 ? idx.starts[i] : idx.starts[i] + node.length;
    }
  }
  return idx.text.length;
}

function toPoint(idx: TextIndex, at: number): [Text, number] | null {
  if (!idx.nodes.length) return null;
  let lo = 0;
  let hi = idx.nodes.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (idx.starts[mid] <= at) lo = mid;
    else hi = mid - 1;
  }
  const node = idx.nodes[lo];
  return [node, Math.min(node.length, Math.max(0, at - idx.starts[lo]))];
}

function toRange(idx: TextIndex, start: number, end: number) {
  const a = toPoint(idx, start);
  const b = toPoint(idx, end);
  if (!a || !b) return null;
  const range = document.createRange();
  range.setStart(a[0], a[1]);
  // An end that falls exactly on a node boundary belongs to the earlier node
  if (b[1] === 0 && end > start) {
    const i = idx.nodes.indexOf(b[0]);
    if (i > 0) {
      range.setEnd(idx.nodes[i - 1], idx.nodes[i - 1].length);
      return range;
    }
  }
  range.setEnd(b[0], b[1]);
  return range;
}

// HDR: WORDS
const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "word" })
    : null;

function wordBounds(text: string, at: number): [number, number] | null {
  if (segmenter) {
    for (const seg of segmenter.segment(text)) {
      const end = seg.index + seg.segment.length;
      if (seg.isWordLike && seg.index <= at && at <= end) return [seg.index, end];
      if (seg.index > at) break;
    }
    return null;
  }
  const word = /[\p{L}\p{N}_'’-]/u;
  let start = at;
  let end = at;
  while (start > 0 && word.test(text[start - 1])) start--;
  while (end < text.length && word.test(text[end])) end++;
  return end > start ? [start, end] : null;
}

type CaretDoc = Document & {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

function caretAt(x: number, y: number): [Node, number] | null {
  const doc = document as CaretDoc;
  if (doc.caretPositionFromPoint) {
    const pos = doc.caretPositionFromPoint(x, y);
    return pos ? [pos.offsetNode, pos.offset] : null;
  }
  if (doc.caretRangeFromPoint) {
    const range = doc.caretRangeFromPoint(x, y);
    return range ? [range.startContainer, range.startOffset] : null;
  }
  return null;
}

/** The word under a point, or null when the point isn't on a word */
export function wordRangeAtPoint(root: HTMLElement, x: number, y: number) {
  const caret = caretAt(x, y);
  if (!caret || !isMarkableNode(root, caret[0])) return null;
  const node = caret[0] as Text;
  const bounds = wordBounds(node.data, caret[1]);
  if (!bounds) return null;
  const range = document.createRange();
  range.setStart(node, bounds[0]);
  range.setEnd(node, bounds[1]);
  // The caret snaps to the nearest text even from the margin or a line's
  // empty end, so only count taps that land on the word itself
  const slop = 4;
  const hit = Array.from(range.getClientRects()).some(
    (r) => x >= r.left - slop && x <= r.right + slop && y >= r.top - slop && y <= r.bottom + slop,
  );
  return hit ? range : null;
}

const WORD_CHAR = /[\p{L}\p{N}]/u;

function firstWordFrom(node: Text, at: number) {
  while (at < node.length && !WORD_CHAR.test(node.data[at])) at++;
  const bounds = wordBounds(node.data, at);
  if (!bounds) return null;
  const range = document.createRange();
  range.setStart(node, bounds[0]);
  range.setEnd(node, bounds[1]);
  return range;
}

/**
 * First word on the line being read (the keyboard path): the first block
 * that reaches the reading line, from its first word, or from the line at
 * the reading line when the block started above it.
 */
export function wordRangeAtReadingLine(root: HTMLElement, line: number) {
  const blocks = root.querySelectorAll<HTMLElement>("p, li, h2, h3, h4, blockquote, td");
  for (const block of Array.from(blocks)) {
    if (block.closest(SKIP)) continue;
    const r = block.getBoundingClientRect();
    if (r.bottom < line + 8 || r.height === 0) continue;
    if (r.top < line) {
      const step = parseFloat(getComputedStyle(block).lineHeight) || 28;
      for (let y = line; y < Math.min(r.bottom, line + step * 2); y += 6) {
        const caret = caretAt(r.left + 1, y);
        if (caret && isMarkableNode(root, caret[0]) && block.contains(caret[0])) {
          const range = firstWordFrom(caret[0] as Text, caret[1]);
          if (range) return range;
        }
      }
    }
    const idx = indexText(block);
    const first = idx.text.search(WORD_CHAR);
    if (first === -1) continue;
    const bounds = wordBounds(idx.text, first);
    return bounds ? toRange(idx, bounds[0], bounds[1]) : null;
  }
  return null;
}

// HDR: ANCHORS
export function describeRange(root: HTMLElement, range: Range): PlaceMark | null {
  const idx = indexText(root);
  let start = toIndex(idx, range.startContainer, range.startOffset);
  let end = toIndex(idx, range.endContainer, range.endOffset);
  while (start < end && /\s/.test(idx.text[start])) start++;
  while (end > start && /\s/.test(idx.text[end - 1])) end--;
  if (end - start > MAX_QUOTE) {
    end = start + MAX_QUOTE;
    const space = idx.text.lastIndexOf(" ", end);
    if (space > start) end = space;
  }
  if (end <= start) return null;
  return {
    quote: idx.text.slice(start, end),
    prefix: idx.text.slice(Math.max(0, start - CONTEXT), start),
    suffix: idx.text.slice(end, end + CONTEXT),
    offset: start,
    savedAt: Date.now(),
  };
}

function sharedTail(a: string, b: string) {
  let n = 0;
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
  return n;
}

function sharedHead(a: string, b: string) {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

/**
 * Finds a saved mark in the article. `exact` is false when the marked words
 * no longer exist and the range is the word now at the old position.
 */
export function resolveMark(root: HTMLElement, mark: PlaceMark) {
  const idx = indexText(root);
  const { text } = idx;
  const len = mark.quote.length;
  let best = -1;
  let bestScore = -Infinity;
  for (let at = text.indexOf(mark.quote); at !== -1; at = text.indexOf(mark.quote, at + 1)) {
    const score =
      sharedTail(text.slice(Math.max(0, at - mark.prefix.length), at), mark.prefix) +
      sharedHead(text.slice(at + len, at + len + mark.suffix.length), mark.suffix) -
      Math.abs(at - mark.offset) / 10_000;
    if (score > bestScore) {
      bestScore = score;
      best = at;
    }
  }
  if (best !== -1) {
    const range = toRange(idx, best, best + len);
    return range ? { range, exact: true } : null;
  }
  if (!text.trim()) return null;
  // The words were edited away: settle on the nearest word to where they were
  let at = Math.min(mark.offset, text.length - 1);
  while (at < text.length && !WORD_CHAR.test(text[at])) at++;
  const bounds = wordBounds(text, Math.min(at, text.length - 1));
  const range = bounds && toRange(idx, bounds[0], bounds[1]);
  return range ? { range, exact: false } : null;
}

export type Line = { top: number; left: number; width: number; height: number };

/**
 * One box per visual line of a range, relative to `origin`. Built from the
 * text inside the range only, so a fully selected paragraph doesn't add its
 * whole block box.
 */
export function lineBoxes(root: HTMLElement, range: Range, origin: DOMRect): Line[] {
  const rects: DOMRect[] = [];
  const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);
  const first =
    range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer
      : walker.nextNode();
  for (let node = first; node; node = walker.nextNode()) {
    if (!range.intersectsNode(node) || !isMarkableNode(root, node)) continue;
    const part = document.createRange();
    part.selectNodeContents(node);
    if (node === range.startContainer) part.setStart(node, range.startOffset);
    if (node === range.endContainer) part.setEnd(node, range.endOffset);
    rects.push(...Array.from(part.getClientRects()));
  }

  const lines: Line[] = [];
  for (const r of rects) {
    if (r.width < 1 || r.height < 1) continue;
    const top = r.top - origin.top;
    const left = r.left - origin.left;
    const line = lines.find((l) => Math.abs(l.top + l.height / 2 - (top + r.height / 2)) < r.height / 2);
    if (line) {
      const right = Math.max(line.left + line.width, left + r.width);
      line.left = Math.min(line.left, left);
      line.width = right - line.left;
      line.top = Math.min(line.top, top);
      line.height = Math.max(line.height, r.height);
    } else {
      lines.push({ top, left, width: r.width, height: r.height });
    }
  }
  return lines.sort((a, b) => a.top - b.top || a.left - b.left);
}
