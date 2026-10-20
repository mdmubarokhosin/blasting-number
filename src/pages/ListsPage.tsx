import { Button } from "@heroui/react";
import { ClipboardList, Layers, ListPlus, Package, Sun } from "../components/icons";
import { type ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { ListBrowser } from "../components/lists/ListBrowser";
import { useAuth } from "../features/auth/AuthProvider";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useLists } from "../hooks/useLists";
import type { BlastingList } from "../types";
import {
  canCreateList,
  canDeleteList,
  canEditList,
} from "../utils/permissions";
import { computeListStats } from "../utils/stats";
import { activeShifts, shiftName } from "../utils/shifts";

export function ListsPage(): ReactNode {
  const { profile, categories, shifts, can } = useAuth();
  const { lists, loading, error, reload, remove } = useLists();
  const [deleteTarget, setDeleteTarget] = useState<BlastingList | null>(null);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle("আমার তালিকা");

  const stats = useMemo(
    () => computeListStats(lists, categories, undefined, shifts),
    [lists, categories, shifts],
  );
  const activeShiftCount = useMemo(() => activeShifts(shifts).length, [shifts]);

  const canEdit = (list: BlastingList) => canEditList({ list, profile, can });
  const canDelete = (list: BlastingList) =>
    canDeleteList({ list, profile, can });
  const createAllowed = canCreateList(can);

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="আমার তালিকা"
        description="সব শিফটের Blasting কোড লিস্ট — সার্চ, ফিল্টার ও পরিচালনা করুন।"
        align="center"
        actions={
          createAllowed ? (
            <Button onPress={() => navigate("/lists/new")}>
              <ListPlus className="size-4" />
              নতুন তালিকা
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="মোট তালিকা"
          value={stats.totalLists}
          icon={ClipboardList}
          tone="accent"
        />
        <StatCard
          label="মোট আইটেম"
          value={stats.totalItems}
          icon={Package}
          tone="success"
        />
        <StatCard
          label="আজকের তালিকা"
          value={stats.todayLists}
          hint={`${stats.todayItems}টি আইটেম আজ`}
          icon={Sun}
          tone="warning"
        />
        <StatCard
          label="সক্রিয় শিফট"
          value={activeShiftCount}
          hint={`${shifts.length}টি কনফিগার করা`}
          icon={Layers}
        />
      </div>

      <ListBrowser
        lists={lists}
        categories={categories}
        shifts={shifts}
        loading={loading}
        error={error}
        onRetry={reload}
        canEdit={canEdit}
        canDelete={canDelete}
        onDelete={setDeleteTarget}
        emptyAction={
          createAllowed ? (
            <Button onPress={() => navigate("/lists/new")}>
              <ListPlus className="size-4" />
              তালিকা তৈরি করুন
            </Button>
          ) : undefined
        }
      />

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
