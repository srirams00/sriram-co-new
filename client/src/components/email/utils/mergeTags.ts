export type MergePart =
  | { type: 'text'; value: string }
  | { type: 'tag'; name: string };

export function splitMergeTags(text: string): MergePart[] {
  const parts: MergePart[] = [];
  const pattern = /\{\{(\w+)\}\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', value: text.slice(last, match.index) });
    }
    parts.push({ type: 'tag', name: match[1] });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push({ type: 'text', value: text.slice(last) });
  }
  return parts;
}
