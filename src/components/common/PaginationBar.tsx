import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "../icons";
import { type ReactNode } from "react";

export function PaginationBar({
  page,
  pageCount,
  onChange,
  totalItems,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  totalItems?: number;
}): ReactNode {
  if (pageCount <= 1) {
    return totalItems !== undefined ? (
      <p className="text-muted text-center text-xs">মোট {totalItems}টি ফলাফল</p>
    ) : null;
  }
  return (
    <nav className="flex items-center justify-center gap-2" aria-label="পৃষ্ঠা পরিবর্তন">
      <Button
        size="sm"
        variant="secondary"
        isIconOnly
        aria-label="আগের পৃষ্ঠা"
        isDisabled={page <= 1}
        onPress={() => onChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-muted px-2 text-sm tabular-nums">
        {page} / {pageCount}
        {totalItems !== undefined ? <span className="hidden sm:inline"> · {totalItems}টি</span> : null}
      </span>
      <Button
        size="sm"
        variant="secondary"
        isIconOnly
        aria-label="পরের পৃষ্ঠা"
        isDisabled={page >= pageCount}
        onPress={() => onChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
