import { type ReactNode } from "react";
import { splitCode } from "../../utils/parse";
import { FractionText } from "./FractionText";
import { HighlightedText } from "./HighlightedText";

export function CodeText({
  code,
  query,
  className,
}: {
  code: string;
  query?: string;
  className?: string;
}): ReactNode {
  const { body, extra } = splitCode(code);
  return (
    <span className={`bn-mono inline-flex flex-wrap items-center gap-1 ${className ?? ""}`}>
      <HighlightedText text={body} query={query} />
      {extra ? <FractionText value={extra} /> : null}
    </span>
  );
}
