import {
  Alert,
  Button,
  Card,
  Chip,
  Description,
  FieldError,
  Input,
  Label,
  Modal,
  Switch,
  TextField,
  toast,
} from "@heroui/react";
import {
  Check,
  Clock,
  Layers,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "../../components/icons";
import { type ReactNode, useMemo, useState } from "react";
import { ColorField, IconField } from "../../components/admin/AppearanceFields";
import { ShiftBadge } from "../../components/common/Badges";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { InlineLoader } from "../../components/common/LoadingScreen";
import { PageHeader } from "../../components/common/PageHeader";
import { useAuth } from "../../features/auth/AuthProvider";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useSite } from "../../i18n/SiteProvider";
import { useLists } from "../../hooks/useLists";
import {
  dbErrorMessage,
  firstZodError,
  shiftDetailsSchema,
  shiftKeySchema,
} from "../../lib/validation";
import { logActivity } from "../../services/activityLogs";
import {
  createShift,
  deleteShift,
  seedDefaultShifts,
  updateShift,
  updateShiftStatus,
} from "../../services/shifts";
import type { ShiftRecord, ShiftStatus } from "../../types";
import {
  isLegacyShiftId,
  shiftTimeLabel,
  shiftUsage,
} from "../../utils/shifts";

interface ShiftForm {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  color: string;
  icon: string;
  status: ShiftStatus;
  sortOrder: number;
}

function emptyForm(sortOrder: number): ShiftForm {
  return {
    id: "",
    name: "",
    description: "",
    startTime: "",
    endTime: "",
    color: "#0ea5e9",
    icon: "clock",
    status: "active",
    sortOrder,
  };
}

export function AdminShiftsPage(): ReactNode {
  const { shifts, shiftsReady, shiftsError, profile, can } = useAuth();
  const { ui } = useSite();
  const canViewLists = can("lists.view");
  const { lists, loading: listsLoading } = useLists(canViewLists);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ShiftRecord | null>(null);
  const [form, setForm] = useState<ShiftForm>(() => emptyForm(shifts.length));
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShiftRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  useDocumentTitle("শিফট");

  const canAppearance = can("shifts.manageAppearance");
  const canDelete = can("shifts.delete") && canViewLists;
  const usage = useMemo(() => shiftUsage(lists, shifts), [lists, shifts]);
  const usageById = useMemo(
    () => new Map(usage.map((entry) => [entry.shift.id, entry.count])),
    [usage],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(shifts.length));
    setFormError(null);
    setEditorOpen(true);
  };

  const openEdit = (shift: ShiftRecord) => {
    setEditing(shift);
    setForm({
      id: shift.id,
      name: shift.name,
      description: shift.description,
      startTime: shift.startTime,
      endTime: shift.endTime,
      color: shift.color,
      icon: shift.icon,
      status: shift.status,
      sortOrder: shift.sortOrder,
    });
    setFormError(null);
    setEditorOpen(true);
  };

  const save = async () => {
    setFormError(null);
    const parsed = shiftDetailsSchema.safeParse({
      name: form.name,
      description: form.description,
      startTime: form.startTime,
      endTime: form.endTime,
      color: form.color,
      icon: form.icon,
      status: form.status,
      sortOrder: form.sortOrder,
    });
    if (!parsed.success) {
      setFormError(firstZodError(parsed.error));
      return;
    }
    if (!editing) {
      const idParsed = shiftKeySchema.safeParse(form.id);
      if (!idParsed.success) {
        setFormError(firstZodError(idParsed.error));
        return;
      }
      if (shifts.some((shift) => shift.id === idParsed.data)) {
        setFormError("এই shift key ইতিমধ্যে ব্যবহার করা হয়েছে");
        return;
      }
    }
    if (!profile) return;
    setSaving(true);
    try {
      if (editing) {
        await updateShift(editing.id, parsed.data);
        await logActivity(
          "shift_update",
          `শিফট "${parsed.data.name}" আপডেট করা হয়েছে`,
          {
            targetType: "shift",
            targetId: editing.id,
            actorRole: profile.role,
          },
        );
        toast("শিফট আপডেট হয়েছে", { variant: "success" });
      } else {
        const id = form.id.trim().toLowerCase();
        await createShift({ id, ...parsed.data }, profile.uid);
        await logActivity(
          "shift_create",
          `নতুন শিফট "${parsed.data.name}" তৈরি করা হয়েছে`,
          {
            targetType: "shift",
            targetId: id,
            actorRole: profile.role,
          },
        );
        toast("শিফট তৈরি হয়েছে", { variant: "success" });
      }
      setEditorOpen(false);
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (shift: ShiftRecord, active: boolean) => {
    try {
      await updateShiftStatus(shift.id, active ? "active" : "inactive");
      await logActivity(
        "shift_update",
        `শিফট "${shift.name}" ${active ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে`,
        { targetType: "shift", targetId: shift.id, actorRole: profile?.role },
      );
      toast("স্ট্যাটাস পরিবর্তন হয়েছে", { variant: "success" });
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteShift(deleteTarget.id);
      await logActivity(
        "shift_delete",
        `শিফট "${deleteTarget.name}" মুছে ফেলা হয়েছে`,
        {
          targetType: "shift",
          targetId: deleteTarget.id,
          actorRole: profile?.role,
        },
      );
      toast("শিফট মুছে ফেলা হয়েছে", { variant: "success" });
      setDeleteTarget(null);
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
    } finally {
      setDeleting(false);
    }
  };

  const seed = async () => {
    if (!profile) return;
    setSeeding(true);
    try {
      const created = await seedDefaultShifts(profile.uid);
      await logActivity(
        "shift_seed",
        `${created}টি ডিফল্ট শিফট সিড করা হয়েছে`,
      );
      toast(
        created > 0
          ? `${created}টি শিফট তৈরি হয়েছে`
          : "সব ডিফল্ট শিফট আগে থেকেই আছে",
        {
          variant: "success",
        },
      );
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
    } finally {
      setSeeding(false);
    }
  };

  if (!shiftsReady) return <InlineLoader label="শিফট লোড হচ্ছে..." />;
  if (shiftsError) return <ErrorState message={shiftsError} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="শিফট"
        description="শিফটের নাম, সময়, রঙ, আইকন, ক্রম ও স্ট্যাটাস ডেটাবেস থেকে পরিচালনা করুন।"
        actions={
          <>
            {can("shifts.create") ? (
              <Button
                size="sm"
                variant="secondary"
                isPending={seeding}
                onPress={() => void seed()}
              >
                <Sparkles className="size-4" />
                ডিফল্ট
              </Button>
            ) : null}
            {can("shifts.create") ? (
              <Button size="sm" variant="primary" onPress={openCreate}>
                <Plus className="size-4" />
                নতুন শিফট
              </Button>
            ) : null}
          </>
        }
      />

      {shifts.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="কোনো শিফট নেই"
          description="ডিফল্ট দিন/রাত শিফট সিড করুন অথবা নিজের প্রথম শিফট তৈরি করুন। শিফট কনফিগার না থাকলে তালিকা ফর্মে দিন/রাত ফলব্যাক দেখানো হবে।"
          action={
            can("shifts.create") ? (
              <Button onPress={() => void seed()} isPending={seeding}>
                <Sparkles className="size-4" />
                ডিফল্ট শিফট সিড করুন
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bn-card-grid sm:grid-cols-2 xl:grid-cols-3">
          {shifts.map((shift) => {
            const count = usageById.get(shift.id) ?? 0;
            const active = shift.status === "active";
            const reserved = isLegacyShiftId(shift.id);
            return (
              <Card
                key={shift.id}
                className={`bn-card bn-card-center${active ? "" : " opacity-70"}`}
              >
                <Card.Header>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <ShiftBadge shift={shift.id} shifts={shifts} />
                    {!active ? (
                      <Chip size="sm" variant="soft" color="danger">
                        <Chip.Label>নিষ্ক্রিয়</Chip.Label>
                      </Chip>
                    ) : null}
                  </div>
                  <Card.Description>
                    <span className="font-mono text-xs">
                      {shift.id} · {count} তালিকা
                    </span>
                  </Card.Description>
                </Card.Header>
                <Card.Content className="flex flex-col items-center gap-3">
                  <p className="text-muted min-h-8 text-center text-sm">
                    {shift.description || "—"}
                  </p>
                  <p className="text-muted flex items-center gap-1.5 text-center text-xs">
                    <Clock className="size-3.5" />
                    {shiftTimeLabel(shift)}
                  </p>
                  <p className="text-muted text-center text-xs">
                    ক্রম {shift.sortOrder}
                    {reserved ? " · সংরক্ষিত legacy key" : ""}
                  </p>
                  {can("shifts.edit") ? (
                    <Switch
                      isSelected={active}
                      onChange={(selected) =>
                        void toggleStatus(shift, selected)
                      }
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Switch.Content>
                        <Label>{active ? "সক্রিয়" : "নিষ্ক্রিয়"}</Label>
                        <Description>
                          নিষ্ক্রিয় শিফট নতুন তালিকায় নির্বাচন করা যাবে না
                        </Description>
                      </Switch.Content>
                    </Switch>
                  ) : null}
                </Card.Content>
                {can("shifts.edit") ? (
                  <Card.Footer>
                    <div className="bn-card-actions">
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`${shift.name} সম্পাদনা`}
                        onPress={() => openEdit(shift)}
                      >
                        <Pencil className="size-4" />
                        সম্পাদনা
                      </Button>
                      <Button
                        size="sm"
                        variant="danger-soft"
                        aria-label={`${shift.name} মুছুন`}
                        isDisabled={
                          listsLoading || count > 0 || reserved || !canDelete
                        }
                        onPress={() => setDeleteTarget(shift)}
                      >
                        <Trash2 className="size-4" />
                        মুছুন
                      </Button>
                    </div>
                  </Card.Footer>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {!canViewLists ? (
        <Alert status="warning">
          <Alert.Indicator>
            <Layers className="size-4" />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>ব্যবহার গণনা সীমিত</Alert.Title>
            <Alert.Description>
              তালিকা দেখার অনুমতি না থাকায় শিফটের ব্যবহার যাচাই করা যাচ্ছে না।
              নিরাপত্তার জন্য শিফট মুছুন বন্ধ রাখা হয়েছে।
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <Modal isOpen={editorOpen} onOpenChange={setEditorOpen}>
        <Modal.Backdrop>
          <Modal.Container size="lg">
            <Modal.Dialog className="max-h-[92dvh]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  {editing ? "শিফট সম্পাদনা" : "নতুন শিফট"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4 overflow-y-auto">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    name="shift-id"
                    isRequired
                    isDisabled={Boolean(editing)}
                    value={form.id}
                    onChange={(id) => setForm((prev) => ({ ...prev, id }))}
                  >
                    <Label>{ui("শিফট কী")}</Label>
                    <Input placeholder="morning" className="font-mono" />
                    <Description>
                      ইংরেজি lowercase, সংখ্যা ও হাইফেন; ৩–৪০ অক্ষর; পরে বদলানো
                      যাবে না
                    </Description>
                  </TextField>
                  <TextField
                    name="shift-name"
                    isRequired
                    value={form.name}
                    onChange={(name) => setForm((prev) => ({ ...prev, name }))}
                  >
                    <Label>নাম</Label>
                    <Input placeholder="সকাল" />
                  </TextField>
                </div>

                <TextField
                  name="shift-description"
                  value={form.description}
                  onChange={(description) =>
                    setForm((prev) => ({ ...prev, description }))
                  }
                >
                  <Label>বিবরণ</Label>
                  <Input placeholder="এই শিফটের সময়সূচি..." />
                </TextField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    name="shift-start"
                    value={form.startTime}
                    onChange={(startTime) =>
                      setForm((prev) => ({ ...prev, startTime }))
                    }
                  >
                    <Label>শুরুর সময়</Label>
                    <Input type="time" />
                    <Description>
                      সময় না দিলে শিফটে নির্দিষ্ট সময়সীমা থাকবে না
                    </Description>
                  </TextField>
                  <TextField
                    name="shift-end"
                    value={form.endTime}
                    onChange={(endTime) =>
                      setForm((prev) => ({ ...prev, endTime }))
                    }
                  >
                    <Label>শেষ সময়</Label>
                    <Input type="time" />
                    <Description>
                      শুরুর সময় দিলে শেষ সময়ও দিতে হবে
                    </Description>
                  </TextField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorField
                    color={form.color}
                    isDisabled={!canAppearance}
                    onChange={(color) =>
                      setForm((prev) => ({ ...prev, color }))
                    }
                  />
                  <TextField
                    name="shift-sort"
                    value={String(form.sortOrder)}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        sortOrder: Number(value.replace(/\D/g, "")) || 0,
                      }))
                    }
                  >
                    <Label>ক্রম (sort order)</Label>
                    <Input inputMode="numeric" />
                  </TextField>
                </div>

                <IconField
                  icon={form.icon}
                  isDisabled={!canAppearance}
                  onChange={(icon) => setForm((prev) => ({ ...prev, icon }))}
                />

                {!canAppearance ? (
                  <p className="text-muted text-xs">
                    রঙ ও আইকন পরিবর্তনের জন্য “শিফটের রঙ ও আইকন” অনুমতি
                    প্রয়োজন।
                  </p>
                ) : null}

                <Switch
                  isSelected={form.status === "active"}
                  onChange={(selected) =>
                    setForm((prev) => ({
                      ...prev,
                      status: selected ? "active" : "inactive",
                    }))
                  }
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Content>
                    <Label>সক্রিয় শিফট</Label>
                    <Description>
                      নিষ্ক্রিয় শিফট নতুন তালিকায় দেখা যাবে না
                    </Description>
                  </Switch.Content>
                </Switch>

                {formError ? <FieldError>{formError}</FieldError> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onPress={() => setEditorOpen(false)}
                  isDisabled={saving}
                >
                  বাতিল
                </Button>
                <Button isPending={saving} onPress={() => void save()}>
                  <Check className="size-4" />
                  {editing ? "সংরক্ষণ করুন" : "শিফট তৈরি করুন"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="শিফট মুছে ফেলবেন?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" মুছে ফেলা হবে। কোনো তালিকায় ব্যবহৃত থাকলে বা legacy দিন/রাত key হলে মুছে ফেলা যাবে না। প্রয়োজনে শিফটটি নিষ্ক্রিয় করুন।`
            : ""
        }
        confirmLabel="মুছে ফেলুন"
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
