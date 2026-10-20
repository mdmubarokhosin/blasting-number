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
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "../../components/icons";
import { type ReactNode, useMemo, useState } from "react";
import { ColorField, IconField } from "../../components/admin/AppearanceFields";
import { PermissionMatrix } from "../../components/admin/PermissionMatrix";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { InlineLoader } from "../../components/common/LoadingScreen";
import { PageHeader } from "../../components/common/PageHeader";
import { RoleBadge } from "../../components/common/Badges";
import { useAuth } from "../../features/auth/AuthProvider";
import { effectiveRoleKey } from "../../lib/defaults";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useSite } from "../../i18n/SiteProvider";
import { useProfiles } from "../../hooks/useProfiles";
import {
  permissionsToIds,
  permissionsToMap,
} from "../../lib/permissions";
import { dbErrorMessage, firstZodError, roleDetailsSchema, roleKeySchema } from "../../lib/validation";
import { logActivity } from "../../services/activityLogs";
import {
  createRole,
  deleteRole,
  seedDefaultRoles,
  updateRole,
  updateRoleStatus,
  type RoleDraft,
} from "../../services/roles";
import { syncAllRoleCounts } from "../../services/userAdmin";
import type { RoleRecord, RoleStatus } from "../../types";

interface RoleForm {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: RoleStatus;
  sortOrder: number;
  permissions: string[];
}

function emptyForm(sortOrder: number): RoleForm {
  return {
    id: "",
    name: "",
    description: "",
    color: "#2563eb",
    icon: "shield",
    status: "active",
    sortOrder,
    permissions: [],
  };
}

export function AdminRolesPage(): ReactNode {
  const { roles, rolesReady, rolesError, profile, isMaster, can } = useAuth();
  const { ui } = useSite();
  const canReadProfiles = can("users.view");
  const { profiles, loading: profilesLoading } = useProfiles(canReadProfiles);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<RoleRecord | null>(null);
  const [form, setForm] = useState<RoleForm>(() => emptyForm(roles.length));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoleRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  useDocumentTitle("রোল ও অনুমতি");

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of profiles) {
      const key = effectiveRoleKey(entry.role);
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [profiles]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(roles.length));
    setError(null);
    setEditorOpen(true);
  };

  const openEdit = (role: RoleRecord) => {
    if (!isMaster || role.protected) return;
    setEditing(role);
    setForm({
      id: role.id,
      name: role.name,
      description: role.description,
      color: role.color,
      icon: role.icon,
      status: role.status,
      sortOrder: role.sortOrder,
      permissions: permissionsToIds(role.permissions),
    });
    setError(null);
    setEditorOpen(true);
  };

  const save = async () => {
    if (!isMaster) {
      setError("রোল পরিবর্তন শুধু Master Admin করতে পারেন");
      return;
    }
    setError(null);
    const parsed = roleDetailsSchema.safeParse({
      name: form.name,
      description: form.description,
      color: form.color,
      icon: form.icon,
      status: form.status,
      sortOrder: form.sortOrder,
    });
    if (!parsed.success) {
      setError(firstZodError(parsed.error));
      return;
    }
    if (!editing) {
      const idParsed = roleKeySchema.safeParse(form.id);
      if (!idParsed.success) {
        setError(firstZodError(idParsed.error));
        return;
      }
      if (roles.some((role) => role.id === idParsed.data)) {
        setError("এই Role key ইতিমধ্যে ব্যবহার করা হয়েছে");
        return;
      }
    }
    const draft: Omit<RoleDraft, "id"> = {
      ...parsed.data,
      permissions: permissionsToMap(form.permissions),
    };
    if (!profile) return;
    setSaving(true);
    try {
      if (editing) {
        await updateRole(editing.id, draft);
        await logActivity("role_update", `রোল "${parsed.data.name}" আপডেট করা হয়েছে`, {
          targetType: "role",
          targetId: editing.id,
          actorRole: profile.role,
        });
        toast("রোল আপডেট হয়েছে", { variant: "success" });
      } else {
        await createRole({ id: form.id.trim().toLowerCase(), ...draft }, profile.uid);
        await logActivity("role_create", `নতুন রোল "${parsed.data.name}" তৈরি করা হয়েছে`, {
          targetType: "role",
          targetId: form.id.trim().toLowerCase(),
          actorRole: profile.role,
        });
        toast("রোল তৈরি হয়েছে", { variant: "success" });
      }
      if (profiles.length > 0) void syncAllRoleCounts(profiles, roles).catch(() => undefined);
      setEditorOpen(false);
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !profile) return;
    setDeleting(true);
    try {
      await deleteRole(deleteTarget.id);
      await logActivity("role_delete", `রোল "${deleteTarget.name}" মুছে ফেলা হয়েছে`, {
        targetType: "role",
        targetId: deleteTarget.id,
        actorRole: profile.role,
      });
      toast("রোল মুছে ফেলা হয়েছে", { variant: "success" });
      setDeleteTarget(null);
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (role: RoleRecord, active: boolean) => {
    try {
      await updateRoleStatus(role.id, active ? "active" : "inactive");
      await logActivity("role_update", `রোল "${role.name}" ${active ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে`, {
        targetType: "role",
        targetId: role.id,
        actorRole: profile?.role,
      });
      toast("রোল স্ট্যাটাস পরিবর্তন হয়েছে", { variant: "success" });
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
    }
  };

  const seed = async () => {
    if (!profile) return;
    setSeeding(true);
    try {
      const created = await seedDefaultRoles(profile.uid);
      await logActivity("role_seed", `${created}টি ডিফল্ট রোল সিড করা হয়েছে`);
      toast(created > 0 ? `${created}টি ডিফল্ট রোল তৈরি হয়েছে` : "সব ডিফল্ট রোল আগে থেকেই আছে", {
        variant: "success",
      });
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
    } finally {
      setSeeding(false);
    }
  };

  const syncCounts = async () => {
    if (!profile) return;
    setSyncing(true);
    try {
      await syncAllRoleCounts(profiles, roles);
      await logActivity("role_update", "রোলের ব্যবহারকারী সংখ্যা সিঙ্ক করা হয়েছে");
      toast("ব্যবহারকারী সংখ্যা সিঙ্ক হয়েছে", { variant: "success" });
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
    } finally {
      setSyncing(false);
    }
  };

  if (!rolesReady) return <InlineLoader label="রোল লোড হচ্ছে..." />;
  if (rolesError) return <ErrorState message={rolesError} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="রোল ও অনুমতি"
        description="ডেটাবেস-চালিত রোল তৈরি করুন, অনুমতি নির্ধারণ করুন এবং ব্যবহারকারী সংখ্যা দেখুন।"
        actions={
          <>
            {isMaster ? (
              <>
                <Button size="sm" variant="secondary" isPending={seeding} onPress={() => void seed()}>
                  <Sparkles className="size-4" />
                  ডিফল্ট রোল
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  isPending={syncing}
                  isDisabled={!canReadProfiles || profilesLoading}
                  onPress={() => void syncCounts()}
                >
                  <RefreshCw className="size-4" />
                  কাউন্ট সিঙ্ক
                </Button>
                <Button size="sm" variant="primary" onPress={openCreate}>
                  <Plus className="size-4" />
                  নতুন রোল
                </Button>
              </>
            ) : null}
          </>
        }
      />

      {!isMaster ? (
        <Alert status="warning">
          <Alert.Indicator>
            <Lock className="size-4" />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>শুধুমাত্র দেখা</Alert.Title>
            <Alert.Description>
              রোল তৈরি, সম্পাদনা বা মুছে ফেলা শুধু protected Master Admin করতে পারেন।
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {roles.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="কোনো রোল নেই"
          description="ডিফল্ট রোল সিড করুন অথবা প্রথম রোল তৈরি করুন।"
          action={
            isMaster ? (
              <Button onPress={() => void seed()} isPending={seeding}>
                <Sparkles className="size-4" />
                ডিফল্ট রোল সিড করুন
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bn-card-grid md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => {
            const assigned = canReadProfiles ? (counts[role.id] ?? 0) : role.assignedUserCount;
            const active = role.status === "active";
            return (
              <Card key={role.id} className={`bn-card bn-card-center${active ? "" : " opacity-70"}`}>
                <Card.Header>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <RoleBadge role={role} />
                    {role.protected ? (
                      <Chip size="sm" variant="soft" color="warning">
                        <Chip.Label>{ui("সুরক্ষিত")}</Chip.Label>
                      </Chip>
                    ) : null}
                    {!active ? (
                      <Chip size="sm" variant="soft" color="danger">
                        <Chip.Label>নিষ্ক্রিয়</Chip.Label>
                      </Chip>
                    ) : null}
                  </div>
                  <Card.Description>
                    <span className="font-mono text-xs">{role.id}</span>
                  </Card.Description>
                </Card.Header>
                <Card.Content className="flex flex-col items-center gap-3">
                  <p className="text-muted min-h-8 text-sm">{role.description || "—"}</p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="text-muted size-4" />
                      {role.protected ? "সব অনুমতি" : Object.keys(role.permissions).length} অনুমতি
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="text-muted size-4" />
                      {assigned} ইউজার
                    </span>
                  </div>
                  {isMaster && !role.protected ? (
                    <Switch
                      isSelected={active}
                      onChange={(selected) => void toggleStatus(role, selected)}
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Switch.Content>
                        <Label>{active ? "সক্রিয়" : "নিষ্ক্রিয়"}</Label>
                        <Description>নিষ্ক্রিয় রোলের ইউজার অ্যাপে ঢুকতে পারবে না</Description>
                      </Switch.Content>
                    </Switch>
                  ) : null}
                </Card.Content>
                {isMaster && !role.protected ? (
                  <Card.Footer>
                    <div className="bn-card-actions">
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`${role.name} সম্পাদনা`}
                        onPress={() => openEdit(role)}
                      >
                        <Pencil className="size-4" />
                        সম্পাদনা
                      </Button>
                      <Button
                        size="sm"
                        variant="danger-soft"
                        aria-label={`${role.name} মুছুন`}
                        isDisabled={profilesLoading || role.isSystemRole || assigned > 0}
                        onPress={() => setDeleteTarget(role)}
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

      <Modal isOpen={editorOpen} onOpenChange={setEditorOpen}>
        <Modal.Backdrop>
          <Modal.Container size="lg">
            <Modal.Dialog className="max-h-[92dvh]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>{editing ? "রোল সম্পাদনা" : "নতুন রোল"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4 overflow-y-auto">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    name="role-id"
                    isRequired
                    isDisabled={Boolean(editing)}
                    value={form.id}
                    onChange={(id) => setForm((prev) => ({ ...prev, id }))}
                  >
                    <Label>{ui("রোল কী")}</Label>
                    <Input placeholder="supervisor" className="font-mono" />
                    <Description>ইংরেজি lowercase, সংখ্যা ও হাইফেন; পরে বদলানো যাবে না</Description>
                  </TextField>
                  <TextField
                    name="role-name"
                    isRequired
                    value={form.name}
                    onChange={(name) => setForm((prev) => ({ ...prev, name }))}
                  >
                    <Label>নাম</Label>
                    <Input placeholder="Supervisor" />
                  </TextField>
                </div>

                <TextField
                  name="role-description"
                  value={form.description}
                  onChange={(description) => setForm((prev) => ({ ...prev, description }))}
                >
                  <Label>বিবরণ</Label>
                  <Input placeholder="এই রোলের দায়িত্ব..." />
                </TextField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorField
                    color={form.color}
                    onChange={(color) => setForm((prev) => ({ ...prev, color }))}
                  />
                  <TextField
                    name="role-sort"
                    value={String(form.sortOrder)}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, sortOrder: Number(value.replace(/\D/g, "")) || 0 }))
                    }
                  >
                    <Label>ক্রম (sort order)</Label>
                    <Input inputMode="numeric" />
                  </TextField>
                </div>

                <IconField
                  icon={form.icon}
                  onChange={(icon) => setForm((prev) => ({ ...prev, icon }))}
                />

                <Switch
                  isSelected={form.status === "active"}
                  onChange={(selected) =>
                    setForm((prev) => ({ ...prev, status: selected ? "active" : "inactive" }))
                  }
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Content>
                    <Label>সক্রিয় রোল</Label>
                    <Description>নিষ্ক্রিয় রোল শুধু দেখার জন্য থাকবে, assign করা যাবে না</Description>
                  </Switch.Content>
                </Switch>

                <section>
                  <h3 className="mb-2 text-sm font-semibold">অনুমতি ম্যাট্রিক্স</h3>
                  <PermissionMatrix
                    selected={form.permissions}
                    onChange={(permissions) => setForm((prev) => ({ ...prev, permissions }))}
                  />
                </section>

                {error ? <FieldError>{error}</FieldError> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={() => setEditorOpen(false)} isDisabled={saving}>
                  বাতিল
                </Button>
                <Button isPending={saving} onPress={() => void save()}>
                  {editing ? "সংরক্ষণ করুন" : "রোল তৈরি করুন"}
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
        title="রোল মুছে ফেলবেন?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" স্থায়ীভাবে মুছে যাবে। এই রোলে কোনো ইউজার থাকলে মুছে ফেলা যাবে না।`
            : ""
        }
        confirmLabel="মুছে ফেলুন"
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
