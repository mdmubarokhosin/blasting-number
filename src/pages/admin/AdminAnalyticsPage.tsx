import { Card } from "@heroui/react";
import { type ReactNode, useMemo, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  DateRangeFilter,
  type DateRangeValue,
  presetRange,
} from "../../components/common/DateRangeFilter";
import { EmptyState } from "../../components/common/EmptyState";
import { PageHeader } from "../../components/common/PageHeader";
import { ChartPanel } from "../../components/charts/ChartPanel";
import {
  CHART_COLORS,
  barOptions,
  doughnutOptions,
  lineOptions,
} from "../../components/charts/chartSetup";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useAuth } from "../../features/auth/AuthProvider";
import { chartShiftUsage } from "../../utils/shifts";
import { categoryUsage } from "../../utils/categories";
import { useLists } from "../../hooks/useLists";
import { useProfiles } from "../../hooks/useProfiles";
import type { BlastingList } from "../../types";
import { toISO, todayISO } from "../../utils/format";
import {
  computeListStats,
  filterListsByDateRange,
  listCountsByDay,
  topOwners,
} from "../../utils/stats";

function shortDay(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

function buildDays(
  from: string | null,
  to: string | null,
  lists: BlastingList[],
): string[] {
  const end = to ?? todayISO();
  const start =
    from ??
    (lists.length > 0
      ? [...lists].sort((a, b) => a.date.localeCompare(b.date))[0].date
      : todayISO());
  const out: string[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor <= end && guard < 180) {
    out.push(cursor);
    const date = new Date(`${cursor}T00:00:00`);
    date.setDate(date.getDate() + 1);
    cursor = date.toISOString().slice(0, 10);
    guard += 1;
  }
  return out;
}

export function AdminAnalyticsPage(): ReactNode {
  const { profiles, loading: usersLoading } = useProfiles();
  const { categories, shifts } = useAuth();
  const { lists, loading: listsLoading } = useLists();
  const [range, setRange] = useState<DateRangeValue>(() => presetRange("90"));
  useDocumentTitle("বিশ্লেষণ");

  const filteredLists = useMemo(
    () => filterListsByDateRange(lists, range.from, range.to),
    [lists, range.from, range.to],
  );
  const days = useMemo(
    () => buildDays(range.from, range.to, lists),
    [range.from, range.to, lists],
  );
  const stats = useMemo(
    () => computeListStats(filteredLists, categories, undefined, shifts),
    [filteredLists, categories, shifts],
  );
  const categoryStats = useMemo(
    () =>
      categoryUsage(filteredLists, categories).filter(
        (entry) => entry.count > 0,
      ),
    [filteredLists, categories],
  );
  const owners = useMemo(() => topOwners(filteredLists, 8), [filteredLists]);

  const userGrowth = useMemo(() => {
    return days.map((day) => {
      const end = new Date(`${day}T23:59:59.999`).getTime();
      return profiles.filter((profile) => profile.createdAt <= end).length;
    });
  }, [days, profiles]);

  const shiftStats = useMemo(
    () => chartShiftUsage(filteredLists, shifts),
    [filteredLists, shifts],
  );
  const loading = usersLoading || listsLoading;
  const empty = filteredLists.length === 0;
  const emptyOwner = owners.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="বিশ্লেষণ"
        description="ডেটাবেসের প্রকৃত তথ্য থেকে তৈরি চার্ট — কোনো নমুনা সংখ্যা নয়।"
      />

      <DateRangeFilter value={range} onChange={setRange} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          title="ইউজার বৃদ্ধি"
          description={`${range.from ?? "শুরু"} → ${range.to ?? todayISO()} সময়ে ক্রমবর্ধমান ইউজার`}
          loading={loading}
          empty={profiles.length === 0}
        >
          <Line
            data={{
              labels: days.map(shortDay),
              datasets: [
                {
                  label: "ইউজার",
                  data: userGrowth,
                  borderColor: CHART_COLORS.accent,
                  backgroundColor: CHART_COLORS.accentFill,
                  fill: true,
                },
              ],
            }}
            options={lineOptions()}
          />
        </ChartPanel>

        <ChartPanel
          title="দৈনিক তালিকা"
          description="নির্বাচিত সময়ে প্রতিদিন তৈরি হওয়া তালিকা"
          loading={loading}
          empty={empty}
        >
          <Bar
            data={{
              labels: days.map(shortDay),
              datasets: [
                {
                  label: "তালিকা",
                  data: listCountsByDay(filteredLists, days),
                  backgroundColor: CHART_COLORS.success,
                  borderRadius: 6,
                },
              ],
            }}
            options={barOptions()}
          />
        </ChartPanel>

        <ChartPanel
          title="ক্যাটাগরি বিভাজন"
          description="মোট আইটেমের ক্যাটাগরি অনুযায়ী অনুপাত"
          loading={loading}
          empty={stats.totalItems === 0}
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

        <ChartPanel
          title="শিফট বিভাজন"
          description="ডেটাবেসে কনফিগার করা শিফট অনুযায়ী তালিকা"
          loading={loading}
          empty={filteredLists.length === 0}
        >
          <Doughnut
            data={{
              labels: shiftStats.map((entry) => entry.shift.name),
              datasets: [
                {
                  data: shiftStats.map((entry) => entry.count),
                  backgroundColor: shiftStats.map(
                    (entry, index) =>
                      entry.shift.color ||
                      [CHART_COLORS.warning, CHART_COLORS.accent][index % 2],
                  ),
                  borderWidth: 0,
                },
              ],
            }}
            options={doughnutOptions()}
          />
        </ChartPanel>
      </div>

      <Card className="bn-card-center">
        <Card.Header>
          <Card.Title className="text-base">সর্বাধিক সক্রিয় মালিক</Card.Title>
          <Card.Description>
            আইটেম সংখ্যা অনুযায়ী শীর্ষ ব্যবহারকারী
          </Card.Description>
        </Card.Header>
        <Card.Content className="w-full">
          {emptyOwner ? (
            <EmptyState
              plain
              title="কোনো তথ্য নেই"
              description="এই সময়ে কোনো তালিকা তৈরি হয়নি।"
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {owners.map((owner, index) => (
                <li
                  key={owner.uid || owner.name}
                  className="bg-default/50 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="bg-accent/10 text-accent inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {owner.name}
                    </span>
                  </span>
                  <span className="text-muted shrink-0 text-xs tabular-nums">
                    {owner.lists} তালিকা · {owner.items} আইটেম
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card.Content>
      </Card>

      <p className="text-muted text-center text-xs">
        ডেটা সোর্স: RTDB `profiles` ও `lists` (আজ {toISO(new Date())})
      </p>
    </div>
  );
}
