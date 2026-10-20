import { Button, Card, Label, ListBox, Select } from "@heroui/react";
import { ClipboardList, Eye, Package, Trash2 } from "../../components/icons";
import { type ReactNode, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CategoryBadge, ShiftBadge } from "../../components/common/Badges";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
  DateRangeFilter,
  type DateRangeValue,
  presetRange,
} from "../../components/common/DateRangeFilter";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { InlineLoader } from "../../components/common/LoadingScreen";
import { PageHeader } from "../../components/common/PageHeader";
import { PaginationBar } from "../../components/common/PaginationBar";
import { SearchInput } from "../../components/common/SearchInput";
import { StatCard } from "../../components/common/StatCard";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useLists } from "../../hooks/useLists";
import { useAuth } from "../../features/auth/AuthProvider";
import { resolveItemCategory } from "../../utils/categories";
import type { BlastingList } from "../../types";
import { useFormat } from "../../hooks/useFormat";
import { computeListStats, filterListsByDateRange } from "../../utils/stats";
import {
  activeShifts,
  shiftFilterOptions,
  shiftName,
} from "../../utils/shifts";

const PAGE_SIZE = 10;

export function AdminListsPage(): ReactNode {
  const { lists, loading, error, reload, remove } = useLists();
  const { categories, shifts, can } = useAuth();
  const fmt = useFormat();
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<DateRangeValue>(() => presetRange("all"));
  const [shiftFilter, setShiftFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<BlastingList | null>(null);
  const canDelete = can("lists.deleteAny");
  const [pending, setPending] = useState(false);
  useDocumentTitle("তালিকা ম্যানেজমেন্ট");

  const ranged = useMemo(
    () => filterListsByDateRange(lists, range.from, range.to),
    [lists, range.from, range.to],
  );
  const stats = useMemo(
    () => computeListStats(ranged, categories, undefined, shifts),
    [ranged, categories, shifts],
  );
  const shiftOptions = useMemo(
    () => shiftFilterOptions(lists, shifts),
    [lists, shifts],
  );
  const activeShiftCount = useMemo(() => activeShifts(shifts).length, [shifts]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ranged.filter((list) => {
      if (shiftFilter !== "all" && list.shift !== shiftFilter) return false;
      if (!needle) return true;
      return (
        list.date.includes(needle) ||
        list.ownerName.toLowerCase().includes(needle) ||
        list.note.toLowerCase().includes(needle) ||
        shiftName(list.shift, shifts).toLowerCase().includes(needle) ||
        Object.values(list.items).some((item) =>
          item.code.toLowerCase().includes(needle),
        )
      );
    });
  }, [ranged, query, shiftFilter, shifts]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setPending(true);
    try {
      await remove(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // toast handled by hook
    } finally {
      setPending(false);
    }
  };

  if (loading) return <InlineLoader label="তালিকা লোড হচ্ছে..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="তালিকা ম্যানেজমেন্ট"
        description="সব ব্যবহারকারীর তালিকা দেখুন ও পরিচালনা করুন।"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="তালিকা"
          value={stats.totalLists}
          icon={ClipboardList}
          tone="accent"
        />
        <StatCard
          label="আইটেম"
          value={stats.totalItems}
          icon={Package}
          tone="success"
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="সক্রিয় শিফট"
            value={activeShiftCount}
            hint={`${stats.totalLists}টি তালিকা`}
            icon={ClipboardList}
            tone="warning"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="তারিখ, মালিক, নোট বা কোড..."
          className="sm:max-w-sm"
        />
        <DateRangeFilter value={range} onChange={setRange} />
        <Select
          name="admin-shift-filter"
          selectedKey={shiftFilter}
          onSelectionChange={(key) => {
            setShiftFilter(String(key));
            setPage(1);
          }}
          className="w-full sm:w-52"
        >
          <Label>শিফট</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="all" textValue="সব শিফট">
                সব শিফট
                <ListBox.ItemIndicator />
              </ListBox.Item>
              {shiftOptions.map((option) => (
                <ListBox.Item
                  key={option.id}
                  id={option.id}
                  textValue={option.name}
                >
                  {option.name}
                  {option.status === "inactive" ? " (নিষ্ক্রিয়)" : ""}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="কোনো তালিকা পাওয়া যায়নি"
          description="ফিল্টার পরিবর্তন করে দেখুন।"
        />
      ) : (
        <Card>
          <Card.Content className="p-0">
            <div className="hidden lg:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-muted border-b text-xs uppercase">
                    <th className="px-4 py-3 font-medium">তারিখ</th>
                    <th className="px-4 py-3 font-medium">শিফট</th>
                    <th className="px-4 py-3 font-medium">মালিক</th>
                    <th className="px-4 py-3 font-medium">আইটেম</th>
                    <th className="px-4 py-3 font-medium">ক্যাটাগরি</th>
                    <th className="px-4 py-3 font-medium">আপডেট</th>
                    <th className="px-4 py-3 text-right font-medium">
                      অ্যাকশন
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((list) => {
                    const usedCategories = [
                      ...new Map(
                        Object.values(list.items).map((item) => {
                          const category = resolveItemCategory(
                            item,
                            categories,
                          );
                          return [category.id, category];
                        }),
                      ).values(),
                    ];
                    return (
                      <tr key={list.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">
                          {fmt.date(list.date)}
                        </td>
                        <td className="px-4 py-3">
                          <ShiftBadge shift={list.shift} shifts={shifts} />
                        </td>
                        <td className="px-4 py-3">{list.ownerName || "—"}</td>
                        <td className="px-4 py-3 tabular-nums">
                          {Object.keys(list.items).length}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {usedCategories.map((category) => (
                              <CategoryBadge
                                key={category.id}
                                category={category}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="text-muted px-4 py-3 text-xs">
                          {fmt.timestamp(list.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Link
                              to={`/lists/${list.id}`}
                              aria-label="তালিকা দেখুন"
                              className="hover:bg-default inline-flex size-8 items-center justify-center rounded-lg"
                            >
                              <Eye className="size-4" />
                            </Link>
                            {canDelete ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                isIconOnly
                                aria-label="তালিকা মুছুন"
                                onPress={() => setDeleteTarget(list)}
                              >
                                <Trash2 className="text-danger size-4" />
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 p-3 lg:hidden">
              {pageItems.map((list) => (
                <div key={list.id} className="bg-surface rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{fmt.date(list.date)}</p>
                      <p className="text-muted text-xs">
                        {list.ownerName || "—"} ·{" "}
                        {fmt.timestamp(list.updatedAt)}
                      </p>
                    </div>
                    <ShiftBadge shift={list.shift} shifts={shifts} />
                  </div>
                  <p className="text-muted mt-2 text-xs">
                    {Object.keys(list.items).length}টি আইটেম
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      to={`/lists/${list.id}`}
                      className="bg-default inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
                    >
                      <Eye className="size-4" />
                      দেখুন
                    </Link>
                    <Button
                      size="sm"
                      variant="danger-soft"
                      onPress={() => setDeleteTarget(list)}
                    >
                      <Trash2 className="size-4" />
                      মুছুন
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <PaginationBar
              page={safePage}
              pageCount={pageCount}
              onChange={setPage}
              totalItems={filtered.length}
            />
          </Card.Content>
        </Card>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="তালিকা মুছে ফেলবেন?"
        message={
          deleteTarget
            ? `${deleteTarget.date} (${shiftName(deleteTarget.shift, shifts)}) তালিকা এবং এর সব আইটেম স্থায়ীভাবে মুছে যাবে।`
            : ""
        }
        confirmLabel="মুছে ফেলুন"
        pending={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
