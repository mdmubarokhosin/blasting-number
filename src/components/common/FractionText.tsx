import { type ReactNode } from "react";

const FRACTION_RE = /^(\d{1,3})\/(\d{1,3})$/;

export function FractionText({ value }: { value: string }): ReactNode {
  const match = value.trim().match(FRACTION_RE);
  if (!match) return <span>{value}</span>;
  return (
    <span
      className="mx-0.5 inline-flex flex-col items-center align-middle leading-none"
      aria-label={`${match[1]} ভাগ ${match[2]}`}
      title={`${match[1]}/${match[2]}`}
    >
      <span className="text-[0.72em] tabular-nums">{match[1]}</span>
      <span className="my-px h-px w-full bg-current" aria-hidden="true" />
      <span className="text-[0.72em] tabular-nums">{match[2]}</span>
    </span>
  );
}
