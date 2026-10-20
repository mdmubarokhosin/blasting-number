import { Card, Chip } from "@heroui/react";
import {
  ClipboardList,
  History,
  Languages,
  LogIn,
  LogOut,
  Moon,
  FileDown,
  Settings,
  Trash2,
  Layers,
  Package,
  ShieldCheck,
  UserCheck,
  Users,
} from "../../components/icons";
import { type ReactNode, useMemo, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { EmptyState } from "../../components/common/EmptyState";
import { StatCard } from "../../components/common/StatCard";
import { ChartPanel } from "../../components/charts/ChartPanel";
import {
  CHART_COLORS,
  barOptions,
  doughnutOptions,
  lineOptions,
} from "../../components/charts/chartSetup";
import {
  DateRangeFilter,
  type DateRangeValue,
  presetRange,
} from "../../components/common/DateRangeFilter";
import { useAuth } from "../../features/auth/AuthProvider";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useLists } from "../../hooks/useLists";
import { useLogs } from "../../hooks/useLogs";
import { useProfiles } from "../../hooks/useProfiles";
import { actionLabel } from "../../utils/actionLabels";
import { todayISO } from "../../utils/format";
import { useFormat } from "../../hooks/useFormat";
import { categoryUsage } from "../../utils/categories";
import { activeShifts } from "../../utils/shifts";
import {
  activityCountsByDay,
  computeListStats,
  computeUserStats,
  filterListsByDateRange,
  filterLogsByDateRange,
  itemCountsByDay,
  listCountsByDay,
} from "../../utils/stats";

function shortDay(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

function activityIcon(action: string) {
  if (action.startsWith("language") || action.startsWith("translation")) return Languages;
  if (action === "login") return LogIn;
  if (action === "logout") return LogOut;
  if (action.startsWith("user")) return Users;
  if (action.startsWith("role")) return ShieldCheck;
  if (action.startsWith("category")) return Layers;
  if (action.startsWith("shift")) return Moon;
  if (action.startsWith("item")) return Package;
  if (action.startsWith("list")) return ClipboardList;
  if (action.startsWith("export")) return FileDown;
  if (action.includes("delete") || action === "audit_clear") return Trash2;
  if (action === "settings_change") return Settings;
  return History;
}

export function AdminDashboardPage(): ReactNode {
  const { settings, categories, shifts } = useAuth();
  const fmt = useFormat();
  const { profiles, loading: usersLoading } = useProfiles();
  const { lists, loading: listsLoading } = useLists();
  const { logs, loading: logsLoading } = useLogs();
  const [range, setRange] = useState<DateRangeValue>(() => presetRange("30"));
  useDocumentTitle("অ্যাডমিন ড্যাশবোর্ড", settings.brandName);

  const filteredLists = useMemo(
    () => filterListsByDateRange(lists, range.from, range.to),
    [lists, range.from, range.to],
  );
  const filteredLogs = useMemo(
    () => filterLogsByDateRange(logs, range.from, range.to),
    [logs, range.from, range.to],
  );

  const days = useMemo(() => {
    const to = range.to ?? todayISO();
    const from =
      range.from ??
      (filteredLists.length > 0
        ? [...filteredLists].sort((a, b) => a.date.localeCompare(b.date))[0]
            .date
        : todayISO());
    const out: string[] = [];
    let cursor = from;
    let guard = 0;
    while (cursor <= to && guard < 180) {
      out.push(cursor);
      const date = new Date(`${cursor}T00:00:00`);
      date.setDate(date.getDate() + 1);
      cursor = date.toISOString().slice(0, 10);
      guard += 1;
    }
    return out;
  }, [filteredLists, range.from, range.to]);

  const userStats = useMemo(() => computeUserStats(profiles), [profiles]);
  const listStats = useMemo(
    () => computeListStats(filteredLists, categories, undefined, shifts),
    [filteredLists, categories, shifts],
  );
  const activeShiftCount = useMemo(() => activeShifts(shifts).length, [shifts]);
  const categoryStats = useMemo(
    () =>
      categoryUsage(filteredLists, categories).filter(
        (entry) => entry.count > 0,
      ),
    [filteredLists, categories],
  );
  const recentLogs = filteredLogs.slice(0, 8);
  const chartLoading = usersLoading || listsLoading;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="ড্যাশবোর্ড"
        description="সংক্ষিপ্ত পরিসংখ্যান ও সাম্প্রতিক কার্যক্রম — সব সংখ্যা সরাসরি ডেটাবেস থেকে।"
      />

      <DateRangeFilter value={range} onChange={setRange} />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="মোট ইউজার"
          value={userStats.totalUsers}
          hint={`${userStats.activeUsers} সক্রিয় অ্যাকাউন্ট · ${userStats.admins} অ্যাডমিন`}
          icon={Users}
          tone="accent"
        />
        <StatCard
          label="মোট তালিকা"
          value={listStats.totalLists}
          hint={`এই সময়ে ${listStats.todayLists}টি আজ`}
          icon={ClipboardList}
          tone="success"
        />
        <StatCard
          label="মোট আইটেম"
          value={listStats.totalItems}
          hint={`${categories.filter((category) => category.status === "active").length} সক্রিয় ক্যাটাগরি · আজ ${listStats.todayItems}টি`}
          icon={Package}
          tone="warning"
        />
        <StatCard
          label="সক্রিয় অ্যাকাউন্ট"
          value={userStats.activeUsers}
          icon={UserCheck}
          tone="success"
        />
        <StatCard
          label="নিষ্ক্রিয় অ্যাকাউন্ট"
          value={userStats.inactiveUsers}
          icon={ShieldCheck}
          tone="danger"
        />
        <StatCard
          label="৭ দিনে নতুন"
          value={userStats.newLast7Days}
          icon={Users}
        />
        <StatCard
          label="মোট শিফট"
          value={shifts.length}
          hint={`${activeShiftCount}টি সক্রিয়`}
          icon={Layers}
          tone="accent"
        />
        <StatCard
          label="সক্রিয় শিফট"
          value={activeShiftCount}
          hint={`${listStats.totalLists}টি তালিকা`}
          icon={Layers}
          tone="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartPanel
            title="তালিকা তৈরির প্রবণতা"
            description="নির্বাচিত সময়ে প্রতিদিন কতটি তালিকা তৈরি হয়েছে"
            loading={chartLoading}
            empty={filteredLists.length === 0}
          >
            <Line
              data={{
                labels: days.map(shortDay),
                datasets: [
                  {
                    label: "তালিকা",
                    data: listCountsByDay(filteredLists, days),
                    borderColor: CHART_COLORS.accent,
                    backgroundColor: CHART_COLORS.accentFill,
                    fill: true,
                  },
                ],
              }}
              options={lineOptions()}
            />
          </ChartPanel>
        </div>
        <ChartPanel
          title="ক্যাটাগরি বিভাজন"
          description="আইটেমের ক্যাটাগরি অনুযায়ী"
          loading={chartLoading}
          empty={listStats.totalItems === 0}
        >
          <Doughnut
            data={{
              labels: categoryStats.map((entry) => entry.category.name),
              datasets: [
                {
                  data: categoryStats.map((entry) => entry.count),
                  backgroundColor: categoryStats.map(
                    (entry, index) =>
                      entry.category.color ||
                      [
                        CHART_COLORS.danger,
                        CHART_COLORS.accent,
                        CHART_COLORS.warning,
                        CHART_COLORS.success,
                      ][index % 4],
                  ),
                  borderWidth: 0,
                },
              ],
            }}
            options={doughnutOptions()}
          />
        </ChartPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartPanel
            title="দৈনিক আইটেম যোগ"
            description="নির্বাচিত সময়ে প্রতিদিন কতটি কোড যোগ হয়েছে"
            loading={chartLoading}
            empty={listStats.totalItems === 0}
          >
            <Bar
              data={{
                labels: days.map(shortDay),
                datasets: [
                  {
                    label: "আইটেম",
                    data: itemCountsByDay(filteredLists, days),
                    backgroundColor: CHART_COLORS.success,
                    borderRadius: 6,
                  },
                ],
              }}
              options={barOptions()}
            />
          </ChartPanel>
        </div>
        <ChartPanel
          title="কার্যক্রমের পরিমাণ"
          description="নির্বাচিত সময়ে প্রতিদিনের অ্যাক্টিভিটি"
          loading={logsLoading}
          empty={filteredLogs.length === 0}
        >
          <Bar
            data={{
              labels: days.map(shortDay),
              datasets: [
                {
                  label: "কার্যক্রম",
                  data: activityCountsByDay(filteredLogs, days),
                  backgroundColor: CHART_COLORS.warning,
                  borderRadius: 6,
                },
              ],
            }}
            options={barOptions()}
          />
        </ChartPanel>
      </div>

      <Card>
        <Card.Header className="flex-row items-center justify-between gap-3">
          <div className="min-w-0">
            <Card.Title className="text-base">সাম্প্রতিক কার্যক্রম</Card.Title>
            <Card.Description>সর্বশেষ ৮টি লগ এন্ট্রি — নতুন আগে।</Card.Description>
          </div>
          <Link to="/admin/logs" className="text-accent shrink-0 text-sm font-medium">
            সব কার্যক্রম দেখুন
          </Link>
        </Card.Header>
        <Card.Content className="w-full">
          {recentLogs.length === 0 ? (
            <EmptyState
              plain
              icon={History}
              title="কোনো কার্যক্রম নেই"
              description="এখনো কোনো লগ তৈরি হয়নি।"
            />
          ) : (
            <ul className="divide-border flex flex-col divide-y">
              {recentLogs.map((log) => {
                const Icon = activityIcon(log.action);
                return (
                  <li key={log.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span
                      className="bg-accent/10 text-accent mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl"
                      aria-hidden="true"
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip size="sm" variant="soft" color="accent">
                          <Chip.Label>{actionLabel(log.action)}</Chip.Label>
                        </Chip>
                        {log.outcome === "failure" ? (
                          <Chip size="sm" variant="soft" color="danger">
                            <Chip.Label>ব্যর্থ</Chip.Label>
                          </Chip>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-sm break-words">{log.details}</p>
                      <p className="text-muted mt-1 text-xs">
                        {log.actorName || "—"}
                        {log.actorRole ? ` · ${log.actorRole}` : ""} · {fmt.timestamp(log.timestamp)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
