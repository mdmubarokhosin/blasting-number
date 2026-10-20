import { Fragment, type ReactNode } from "react";

interface Part {
  text: string;
  match: boolean;
}

function split(text: string, query: string): Part[] {
  const q = query.trim();
  if (!q) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: Part[] = [];
  let index = 0;
  while (index < text.length) {
    const found = lower.indexOf(needle, index);
    if (found === -1) {
      parts.push({ text: text.slice(index), match: false });
      break;
    }
    if (found > index) parts.push({ text: text.slice(index, found), match: false });
    parts.push({ text: text.slice(found, found + needle.length), match: true });
    index = found + needle.length;
  }
  return parts;
}

export function HighlightedText({
  text,
  query,
  className,
}: {
  text: string;
  query?: string;
  className?: string;
}): ReactNode {
  if (!query?.trim()) return <span className={className}>{text}</span>;
  const parts = split(text, query);
  return (
    <span className={className}>
      {parts.map((part, i) => (
        <Fragment key={`${part.text}-${i}`}>
          {part.match ? <mark className="highlight-match">{part.text}</mark> : part.text}
        </Fragment>
      ))}
    </span>
  );
}
