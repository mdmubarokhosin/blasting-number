import { Button, Card, Separator } from "@heroui/react";
import {
  ArrowLeft,
  CalendarDays,
  Copy,
  ListChecks,
  Pencil,
  ScanLine,
  Search,
  Trash2,
  UserRound,
} from "../components/icons";
import { type ReactNode, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "@heroui/react";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingScreen } from "../components/common/LoadingScreen";
import { PaginationBar } from "../components/common/PaginationBar";
import { SearchInput } from "../components/common/SearchInput";
import { CategoryBadge, ShiftBadge } from "../components/common/Badges";
import { CodeText } from "../components/common/CodeText";
import { ExportActions } from "../components/lists/ExportActions";
import { ItemEditDialog } from "../components/lists/ItemEditDialog";
import { ItemForm, type PendingItem } from "../components/lists/ItemForm";
import { OcrScannerDialog } from "../components/lists/OcrScannerDialog";
import { useAuth } from "../features/auth/AuthProvider";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useLists } from "../hooks/useLists";
import type { ListItem } from "../types";
import { shiftLabel } from "../utils/format";
import { useFormat } from "../hooks/useFormat";
import { listToArray } from "../utils/listItems";
import { canDeleteList, canEditList } from "../utils/permissions";
import { categoryUsage, resolveItemCategory } from "../utils/categories";
import type { ItemCategoryInput } from "../services/lists";

const PAGE_SIZE = 20;

export function ListDetailsPage(): ReactNode {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { profile, categories, shifts, can, settings } = useAuth();
  const fmt = useFormat();
  const {
    getList,
    loading,
    error,
    reload,
    addItems,
    updateItem,
    removeItem,
    remove,
    findDuplicateCode,
  } = useLists();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "code">("newest");
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState<ListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ListItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [deleteListOpen, setDeleteListOpen] = useState(false);
  const [deleteListPending, setDeleteListPending] = useState(false);

  const list = listId ? getList(listId) : undefined;
  useDocumentTitle(list ? `${fmt.date(list.date)} তালিকা` : "তালিকা");

  const items = useMemo(() => {
    if (!list) return [];
    const needle = query.trim().toLowerCase();
    const filtered = listToArray(list).filter((item) => {
      const resolved = resolveItemCategory(item, categories);
      if (category !== "all" && resolved.id !== category) return false;
      if (!needle) return true;
      return (
        item.code.toLowerCase().includes(needle) ||
        item.createdByName.toLowerCase().includes(needle) ||
        resolved.name.toLowerCase().includes(needle)
      );
    });
    if (sort === "oldest") return filtered;
    if (sort === "code")
      return [...filtered].sort((a, b) => a.code.localeCompare(b.code));
    return [...filtered].reverse();
  }, [list, query, category, sort, categories]);

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = items.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  if (loading) return <LoadingScreen label="তালিকা লোড হচ্ছে..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!list) {
    return (
      <EmptyState
        icon={ListChecks}
        title="তালিকা পাওয়া যায়নি"
        description="তালিকাটি মুছে ফেলা হয়েছে অথবা লিংকটি ভুল।"
        action={
          <Link to="/lists" className="text-accent text-sm font-medium">
            ← সব তালিকা দেখুন
          </Link>
        }
      />
    );
  }

  const editable = canEditList({ list, profile, can });
  const deletable = canDeleteList({ list, profile, can });
  const canExport = can("lists.export");
  const categoryStats = categoryUsage([list], categories).filter(
    (entry) => entry.count > 0 || entry.category.status === "active",
  );

  const handleAdd = async (pendingItems: PendingItem[]) => {
    await addItems(list.id, pendingItems);
    return pendingItems.length;
  };

  const handleOcrAdd = async (ocrItems: ItemCategoryInput[]) => {
    const unique = ocrItems.filter((item) => !findDuplicateCode(item.code));
    const skipped = ocrItems.length - unique.length;
    if (skipped > 0) {
      toast(`${skipped}টি ডুপ্লিকেট কোড বাদ দেওয়া হয়েছে`, {
        variant: "warning",
      });
    }
    if (unique.length === 0) return 0;
    await addItems(list.id, unique);
    return unique.length;
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast("কোড কপি হয়েছে", { variant: "success" });
    } catch {
      toast("কপি করা যায়নি", { variant: "danger" });
    }
  };

  const copyAllCodes = async () => {
    const codes = listToArray(list).map((item) => item.code);
    if (codes.length === 0) {
      toast("কপি করার জন্য কোনো কোড নেই", { variant: "warning" });
      return;
    }
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      toast(`${codes.length}টি কোড কপি হয়েছে`, { variant: "success" });
    } catch {
      toast("কপি করা যায়নি", { variant: "danger" });
    }
  };

  const confirmDeleteItem = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await removeItem(list.id, deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // toast handled by hook
    } finally {
      setDeletePending(false);
    }
  };

  const confirmDeleteList = async () => {
    setDeleteListPending(true);
    try {
      await remove(list.id);
      navigate("/lists");
    } catch {
      // toast handled by hook
    } finally {
      setDeleteListPending(false);
    }
  };

  return (
    <div className="bn-page">
      <div className="flex flex-col items-center gap-3 text-center">
        <Link
          to="/lists"
          className="text-muted hover:text-foreground inline-flex w-fit items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" />
          সব তালিকা
        </Link>
        <div className="flex w-full flex-col items-center gap-3">
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center justify-center gap-2 text-2xl font-bold sm:text-3xl">
              <CalendarDays className="text-muted size-6" aria-hidden="true" />
              {fmt.date(list.date)}
              <ShiftBadge shift={list.shift} shifts={shifts} />
            </h1>
            <p className="text-muted mt-1 flex flex-wrap items-center justify-center gap-1.5 text-sm">
              <UserRound className="size-4" aria-hidden="true" />
              {list.ownerName || "—"} · আপডেট {fmt.timestamp(list.updatedAt)}
            </p>
            {list.note ? (
              <p className="text-muted mt-1 text-sm">নোট: {list.note}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => void copyAllCodes()}
            >
              <Copy className="size-4" />
              সব কপি
            </Button>
            {canExport ? (
              <ExportActions
                list={list}
                categories={categories}
                shifts={shifts}
              />
            ) : null}
            {settings.features.ocrScanner && editable ? (
              <Button
                size="sm"
                variant="secondary"
                onPress={() => setOcrOpen(true)}
              >
                <ScanLine className="size-4" />
                OCR
              </Button>
            ) : null}
            {editable ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => navigate(`/lists/${list.id}/edit`)}
                >
                  <Pencil className="size-4" />
                  সম্পাদনা
                </Button>
                {deletable ? (
                  <Button
                    size="sm"
                    variant="danger-soft"
                    onPress={() => setDeleteListOpen(true)}
                  >
                    <Trash2 className="size-4" />
                    মুছুন
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Card className="bn-card bn-card-center">
          <Card.Content className="items-center p-4">
            <p className="bn-stat-label">মোট আইটেম</p>
            <p className="bn-stat-value">{Object.keys(list.items).length}</p>
          </Card.Content>
        </Card>
        {categoryStats.map((entry) => (
          <Card key={entry.category.id} className="bn-card bn-card-center">
            <Card.Content className="flex flex-col items-center gap-2 p-4">
              <CategoryBadge category={entry.category} />
              <p className="bn-stat-value">{entry.count}</p>
            </Card.Content>
          </Card>
        ))}
      </div>

      {editable ? (
        <Card className="bn-card--form">
          <Card.Header className="items-center text-center">
            <Card.Title className="text-base">নতুন কোড যোগ করুন</Card.Title>
            <Card.Description>
              একাধিক কোড একসাথে যোগ করতে প্রতি লাইনে একটি লিখুন।
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <ItemForm
              categories={categories}
              shifts={shifts}
              onAdd={handleAdd}
              findDuplicate={(code) => findDuplicateCode(code)}
            />
          </Card.Content>
        </Card>
      ) : (
        <Card>
          <Card.Content className="text-muted p-4 text-sm">
            এটি অন্য ব্যবহারকারীর তালিকা — আপনি শুধু দেখতে পারবেন, সম্পাদনা করতে
            পারবেন না।
          </Card.Content>
        </Card>
      )}

      <Card>
        <Card.Header className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Card.Title className="text-base">কোড লিস্ট</Card.Title>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SearchInput
                value={query}
                onChange={(value) => {
                  setQuery(value);
                  setPage(1);
                }}
                placeholder="কোড বা নাম..."
                className="sm:w-64"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={category === "all" ? "primary" : "secondary"}
                  onPress={() => {
                    setCategory("all");
                    setPage(1);
                  }}
                >
                  সব
                </Button>
                {categoryStats.map((entry) => (
                  <Button
                    key={entry.category.id}
                    size="sm"
                    variant={
                      category === entry.category.id ? "primary" : "secondary"
                    }
                    onPress={() => {
                      setCategory(entry.category.id);
                      setPage(1);
                    }}
                  >
                    {entry.category.name}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() =>
                    setSort((current) =>
                      current === "newest"
                        ? "oldest"
                        : current === "oldest"
                          ? "code"
                          : "newest",
                    )
                  }
                >
                  <Search className="size-4" />
                  {sort === "newest"
                    ? "নতুন আগে"
                    : sort === "oldest"
                      ? "পুরনো আগে"
                      : "কোড অনুযায়ী"}
                </Button>
              </div>
            </div>
          </div>
        </Card.Header>
        <Separator />
        <Card.Content className="p-0 sm:p-2">
          {items.length === 0 ? (
            <EmptyState
              plain
              icon={ListChecks}
              title={
                query || category !== "all"
                  ? "কোনো কোড পাওয়া যায়নি"
                  : "এখনো কোনো কোড নেই"
              }
              description={
                query || category !== "all"
                  ? "সার্চ বা ফিল্টার পরিবর্তন করুন।"
                  : "উপরের ফর্ম থেকে প্রথম কোডটি যোগ করুন।"
              }
            />
          ) : (
            <div className="flex flex-col">
              <div className="hidden lg:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-muted border-b text-xs uppercase">
                      <th className="px-4 py-2 font-medium">#</th>
                      <th className="px-4 py-2 font-medium">ক্যাটাগরি</th>
                      <th className="px-4 py-2 font-medium">কোড</th>
                      <th className="px-4 py-2 font-medium">যোগ করেছেন</th>
                      <th className="px-4 py-2 font-medium text-right">
                        অ্যাকশন
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, index) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="text-muted px-4 py-2.5 tabular-nums">
                          {(safePage - 1) * PAGE_SIZE + index + 1}
                        </td>
                        <td className="px-4 py-2.5">
                          <CategoryBadge
                            category={resolveItemCategory(item, categories)}
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <CodeText code={item.code} query={query} />
                        </td>
                        <td className="text-muted px-4 py-2.5">
                          {item.createdByName || "—"}
                          <span className="block text-xs">
                            {fmt.timestamp(item.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              isIconOnly
                              aria-label="কোড কপি"
                              onPress={() => void copyCode(item.code)}
                            >
                              <Copy className="size-4" />
                            </Button>
                            {editable ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  isIconOnly
                                  aria-label="আইটেম সম্পাদনা"
                                  onPress={() => setEditTarget(item)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  isIconOnly
                                  aria-label="আইটেম মুছুন"
                                  onPress={() => setDeleteTarget(item)}
                                >
                                  <Trash2 className="text-danger size-4" />
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 p-2 lg:hidden">
                {pageItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-surface rounded-xl border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CategoryBadge
                          category={resolveItemCategory(item, categories)}
                        />
                        <p className="mt-2">
                          <CodeText code={item.code} query={query} />
                        </p>
                        <p className="text-muted mt-1 text-xs">
                          {item.createdByName || "—"} ·{" "}
                          {fmt.timestamp(item.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          isIconOnly
                          aria-label="কোড কপি"
                          onPress={() => void copyCode(item.code)}
                        >
                          <Copy className="size-4" />
                        </Button>
                        {editable ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              isIconOnly
                              aria-label="আইটেম সম্পাদনা"
                              onPress={() => setEditTarget(item)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              isIconOnly
                              aria-label="আইটেম মুছুন"
                              onPress={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="text-danger size-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <PaginationBar
                page={safePage}
                pageCount={pageCount}
                onChange={setPage}
                totalItems={items.length}
              />
            </div>
          )}
        </Card.Content>
      </Card>

      <ItemEditDialog
        item={editTarget}
        categories={categories}
        shifts={shifts}
        isOpen={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        findDuplicate={findDuplicateCode}
        onSave={async (patch) => {
          if (editTarget) await updateItem(list.id, editTarget.id, patch);
        }}
      />

      <OcrScannerDialog
        isOpen={ocrOpen}
        onOpenChange={setOcrOpen}
        categories={categories}
        onAdd={handleOcrAdd}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="আইটেম মুছে ফেলবেন?"
        message={deleteTarget ? <CodeText code={deleteTarget.code} /> : ""}
        confirmLabel="মুছে ফেলুন"
        pending={deletePending}
        onConfirm={confirmDeleteItem}
      />

      <ConfirmDialog
        isOpen={deleteListOpen}
        onOpenChange={setDeleteListOpen}
        title="পুরো তালিকা মুছে ফেলবেন?"
        message={`${list.date} (${shiftLabel(list.shift, shifts)}) তালিকা এবং এর সব আইটেম স্থায়ীভাবে মুছে যাবে।`}
        confirmLabel="মুছে ফেলুন"
        pending={deleteListPending}
        onConfirm={confirmDeleteList}
      />
    </div>
  );
}
