import { Button, Card, Chip } from "@heroui/react";
import { CalendarDays, Eye, ListChecks, Pencil, Trash2 } from "../icons";
import { type ReactNode, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type {
  BlastingList,
  CategoryRecord,
  Shift,
  ShiftRecord,
} from "../../types";
import { shiftLabel } from "../../utils/format";
import { useFormat } from "../../hooks/useFormat";
import { EmptyState } from "../common/EmptyState";
import { ErrorState } from "../common/ErrorState";
import { InlineLoader } from "../common/LoadingScreen";
import { PaginationBar } from "../common/PaginationBar";
import { SearchInput } from "../common/SearchInput";
import { CategoryBadge, ShiftBadge } from "../common/Badges";
import { resolveItemCategory } from "../../utils/categories";
import { shiftFilterOptions, shiftName } from "../../utils/shifts";

const PAGE_SIZE = 8;

function categorySummary(
  list: BlastingList,
  categories: CategoryRecord[],
): string {
  const counts = new Map<string, number>();
  for (const item of Object.values(list.items)) {
    const category = resolveItemCategory(item, categories).name;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => `${category} ${count}`)
    .join(" · ");
}

export function ListCard({
  list,
  categories,
  shifts,
  canEdit,
  canDelete,
  onDelete,
  showOwner = true,
}: {
  list: BlastingList;
  categories: CategoryRecord[];
  shifts: ShiftRecord[];
  canEdit: boolean;
  canDelete?: boolean;
  onDelete?: (list: BlastingList) => void;
  showOwner?: boolean;
}): ReactNode {
  const fmt = useFormat();
  const itemCount = Object.keys(list.items).length;
  const summary = categorySummary(list, categories);
  return (
    <Card className="bn-card bn-card-center">
      <Card.Header className="gap-2">
        <Card.Title className="flex flex-wrap items-center justify-center gap-2 text-base">
          <CalendarDays className="text-muted size-4" aria-hidden="true" />
          {fmt.date(list.date)}
        </Card.Title>
        <Card.Description>
          {showOwner ? `তৈরি করেছেন: ${list.ownerName || "—"}` : "লিস্ট"}
        </Card.Description>
        <ShiftBadge shift={list.shift} shifts={shifts} />
      </Card.Header>
      <Card.Content className="flex flex-1 flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Chip size="sm" variant="soft" color="default">
            <Chip.Label>{itemCount}টি আইটেম</Chip.Label>
          </Chip>
          {Object.values(list.items)
            .slice(0, 3)
            .map((item) => (
              <CategoryBadge
                key={item.id}
                category={resolveItemCategory(item, categories)}
              />
            ))}
        </div>
        {summary ? (
          <p className="text-muted text-center text-xs">{summary}</p>
        ) : (
          <p className="text-muted text-center text-xs">
            এখনো কোনো কোড যোগ করা হয়নি।
          </p>
        )}
        {list.note ? (
          <p className="text-muted line-clamp-2 text-center text-xs">
            নোট: {list.note}
          </p>
        ) : null}
      </Card.Content>
      <Card.Footer className="flex flex-wrap items-center justify-center gap-2">
        <Link
          to={`/lists/${list.id}`}
          className="bg-default text-default-foreground hover:bg-default-hover inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
        >
          <Eye className="size-4" />
          বিস্তারিত
        </Link>
        {canEdit ? (
          <Link
            to={`/lists/${list.id}/edit`}
            className="border-border hover:bg-default inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium"
          >
            <Pencil className="size-4" />
            সম্পাদনা
          </Link>
        ) : null}
        {canDelete && onDelete ? (
          <Button
            size="sm"
            variant="danger-soft"
            onPress={() => onDelete(list)}
            aria-label={`${fmt.date(list.date)} তালিকা মুছুন`}
          >
            <Trash2 className="size-4" />
            মুছুন
          </Button>
        ) : null}
      </Card.Footer>
    </Card>
  );
}

export function ListBrowser({
  lists,
  categories,
  shifts,
  loading,
  error,
  onRetry,
  canEdit,
  canDelete = canEdit,
  onDelete,
  showOwner = true,
  emptyTitle = "কোনো তালিকা পাওয়া যায়নি",
  emptyDescription = "নতুন তালিকা তৈরি করে শুরু করুন।",
  emptyAction,
}: {
  lists: BlastingList[];
  categories: CategoryRecord[];
  shifts: ShiftRecord[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  canEdit: (list: BlastingList) => boolean;
  canDelete?: (list: BlastingList) => boolean;
  onDelete?: (list: BlastingList) => void;
  showOwner?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}): ReactNode {
  const [query, setQuery] = useState("");
  const [shift, setShift] = useState<"all" | Shift>("all");
  const [page, setPage] = useState(1);
  const shiftOptions = useMemo(
    () => shiftFilterOptions(lists, shifts),
    [lists, shifts],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return lists.filter((list) => {
      if (shift !== "all" && list.shift !== shift) return false;
      if (!needle) return true;
      if (list.date.includes(needle)) return true;
      if (list.note.toLowerCase().includes(needle)) return true;
      if (list.ownerName.toLowerCase().includes(needle)) return true;
      if (shiftName(list.shift, shifts).toLowerCase().includes(needle))
        return true;
      return Object.values(list.items).some(
        (item) =>
          item.code.toLowerCase().includes(needle) ||
          resolveItemCategory(item, categories)
            .name.toLowerCase()
            .includes(needle),
      );
    });
  }, [lists, query, shift, categories, shifts]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  if (loading) return <InlineLoader label="তালিকা লোড হচ্ছে..." />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="তারিখ, নোট, মালিক বা কোড..."
          className="sm:max-w-sm"
        />
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="শিফট ফিল্টার"
        >
          <Button
            size="sm"
            variant={shift === "all" ? "primary" : "secondary"}
            onPress={() => {
              setShift("all");
              setPage(1);
            }}
          >
            সব শিফট
          </Button>
          {shiftOptions.map((option) => (
            <Button
              key={option.id}
              size="sm"
              variant={shift === option.id ? "primary" : "secondary"}
              onPress={() => {
                setShift(option.id);
                setPage(1);
              }}
            >
              {option.name}
              {option.status === "inactive" ? " (নিষ্ক্রিয়)" : ""}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={query || shift !== "all" ? "কোনো ফলাফল নেই" : emptyTitle}
          description={
            query || shift !== "all"
              ? "সার্চ বা ফিল্টার পরিবর্তন করে দেখুন।"
              : emptyDescription
          }
          action={emptyAction}
        />
      ) : (
        <>
          <div className="bn-card-grid sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                categories={categories}
                shifts={shifts}
                canEdit={canEdit(list)}
                canDelete={canDelete(list)}
                onDelete={onDelete}
                showOwner={showOwner}
              />
            ))}
          </div>
          <PaginationBar
            page={safePage}
            pageCount={pageCount}
            onChange={setPage}
            totalItems={filtered.length}
          />
        </>
      )}
    </div>
  );
}

export function ShiftLabelText({
  shift,
  shifts = [],
}: {
  shift: Shift;
  shifts?: ShiftRecord[];
}): ReactNode {
  return <>{shiftLabel(shift, shifts)}</>;
}
