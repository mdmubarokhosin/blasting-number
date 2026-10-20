import { Button, Card, Label, ListBox, Select } from "@heroui/react";
import { Download, Eraser, History } from "../../components/icons";
import { type ReactNode, useMemo, useState } from "react";
import { toast } from "@heroui/react";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { DateRangeFilter, type DateRangeValue, presetRange } from "../../components/common/DateRangeFilter";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { InlineLoader } from "../../components/common/LoadingScreen";
import { PageHeader } from "../../components/common/PageHeader";
import { PaginationBar } from "../../components/common/PaginationBar";
import { SearchInput } from "../../components/common/SearchInput";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useAuth } from "../../features/auth/AuthProvider";
import { useLogs } from "../../hooks/useLogs";
import { clearLogs } from "../../services/activityLogs";
import { logActivity } from "../../services/activityLogs";
import type { ActivityLog } from "../../types";
import { ACTION_OPTIONS, actionLabel } from "../../utils/actionLabels";
import { useFormat } from "../../hooks/useFormat";
import { filterLogsByDateRange } from "../../utils/stats";

const PAGE_SIZE = 15;

function downloadLogsCsv(logs: ActivityLog[]): void {
  const escape = (value: string) =>
    value.includes(",") || value.includes('"') || value.includes("\n")
      ? `"${value.replace(/"/g, '""')}"`
      : value;
  let csv = "Time,Actor,Action,Details\n";
  for (const log of logs) {
    csv += [
      new Date(log.timestamp).toISOString(),
      escape(log.actorName),
      escape(actionLabel(log.action)),
      escape(log.details),
    ].join(",");
    csv += "\n";
  }
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function AdminLogsPage(): ReactNode {
  const { logs, loading, error } = useLogs();
  const { can } = useAuth();
  const fmt = useFormat();
  const canClear = can("audit.clear");
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [range, setRange] = useState<DateRangeValue>(() => presetRange("30"));
  const [page, setPage] = useState(1);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  useDocumentTitle("অ্যাক্টিভিটি লগ");

  const ranged = useMemo(
    () => filterLogsByDateRange(logs, range.from, range.to),
    [logs, range.from, range.to],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ranged.filter((log) => {
      if (action !== "all" && log.action !== action) return false;
      if (!needle) return true;
      return (
        log.details.toLowerCase().includes(needle) ||
        log.actorName.toLowerCase().includes(needle) ||
        log.action.toLowerCase().includes(needle)
      );
    });
  }, [ranged, query, action]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearLogs();
      await logActivity("settings_change", "সব অ্যাক্টিভিটি লগ মুছে ফেলা হয়েছে");
      toast("সব লগ মুছে ফেলা হয়েছে", { variant: "success" });
      setClearOpen(false);
    } catch {
      toast("লগ মুছে ফেলা যায়নি", { variant: "danger" });
    } finally {
      setClearing(false);
    }
  };

  if (loading) return <InlineLoader label="লগ লোড হচ্ছে..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="অ্যাক্টিভিটি লগ"
        description={`সর্বশেষ ${logs.length}টি লগ এন্ট্রি — নতুন আগে।`}
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={filtered.length === 0}
              onPress={() => downloadLogsCsv(filtered)}
            >
              <Download className="size-4" />
              CSV
            </Button>
            {canClear ? (
              <Button
                size="sm"
                variant="danger-soft"
                isDisabled={logs.length === 0}
                onPress={() => setClearOpen(true)}
              >
                <Eraser className="size-4" />
                লগ মুছুন
              </Button>
            ) : null}
          </>
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SearchInput
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            placeholder="বিবরণ বা নাম..."
            className="sm:max-w-sm"
          />
          <Select
            name="log-action"
            selectedKey={action}
            onSelectionChange={(key) => {
              setAction(String(key));
              setPage(1);
            }}
            className="sm:w-56"
          >
            <Label>অ্যাকশন</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue="সব অ্যাকশন">
                  সব অ্যাকশন
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {ACTION_OPTIONS.map((option) => (
                  <ListBox.Item key={option.key} id={option.key} textValue={option.label}>
                    {option.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={History} title="কোনো লগ নেই" description="এই ফিল্টারে কোনো কার্যক্রম পাওয়া যায়নি।" />
      ) : (
        <Card>
          <Card.Content className="p-0">
            <div className="hidden lg:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-muted border-b text-xs uppercase">
                    <th className="px-4 py-3 font-medium">সময়</th>
                    <th className="px-4 py-3 font-medium">ব্যবহারকারী</th>
                    <th className="px-4 py-3 font-medium">অ্যাকশন</th>
                    <th className="px-4 py-3 font-medium">বিবরণ</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="text-muted px-4 py-3 text-xs whitespace-nowrap">
                        {fmt.timestamp(log.timestamp)}
                      </td>
                      <td className="px-4 py-3">{log.actorName || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="bg-accent/10 text-accent rounded-lg px-2 py-1 text-xs font-medium">
                          {actionLabel(log.action)}
                        </span>
                      </td>
                      <td className="text-muted px-4 py-3">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 p-3 lg:hidden">
              {pageItems.map((log) => (
                <div key={log.id} className="bg-surface rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-accent/10 text-accent rounded-lg px-2 py-1 text-xs font-medium">
                      {actionLabel(log.action)}
                    </span>
                    <span className="text-muted text-xs">{fmt.timestamp(log.timestamp)}</span>
                  </div>
                  <p className="mt-2 text-sm">{log.details}</p>
                  <p className="text-muted mt-1 text-xs">{log.actorName || "—"}</p>
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
        isOpen={clearOpen}
        onOpenChange={setClearOpen}
        title="সব লগ মুছে ফেলবেন?"
        message="সব অ্যাক্টিভিটি লগ স্থায়ীভাবে মুছে যাবে। এই কাজটি ফেরানো যাবে না।"
        confirmLabel="সব মুছুন"
        pending={clearing}
        onConfirm={handleClear}
      />
    </div>
  );
}
