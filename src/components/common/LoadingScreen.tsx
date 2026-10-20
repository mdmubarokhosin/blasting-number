import { Spinner } from "@heroui/react";
import { type ReactNode } from "react";

export function LoadingScreen({ label = "লোড হচ্ছে..." }: { label?: string }): ReactNode {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status">
      <Spinner size="lg" />
      <p className="text-muted text-sm">{label}</p>
    </div>
  );
}

export function InlineLoader({ label = "লোড হচ্ছে..." }: { label?: string }): ReactNode {
  return (
    <div className="flex items-center justify-center gap-2 py-10" role="status">
      <Spinner size="sm" />
      <span className="text-muted text-sm">{label}</span>
    </div>
  );
}
