import {
  Alert,
  Avatar,
  Button,
  Card,
  Description,
  FieldError,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
  toast,
} from "@heroui/react";
import { Pencil, ShieldCheck, UserCheck, UserPlus, UserX, Users } from "../../components/icons";
import { type ReactNode, useMemo, useState } from "react";
import { ActiveBadge, RoleBadge } from "../../components/common/Badges";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { InlineLoader } from "../../components/common/LoadingScreen";
import { PageHeader } from "../../components/common/PageHeader";
import { PaginationBar } from "../../components/common/PaginationBar";
import { SearchInput } from "../../components/common/SearchInput";
import { StatCard } from "../../components/common/StatCard";
import { useAuth } from "../../features/auth/AuthProvider";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useProfiles } from "../../hooks/useProfiles";
import { effectiveRoleKey, isMasterRoleKey } from "../../lib/defaults";
import {
  authErrorMessage,
  dbErrorMessage,
  displayNameSchema,
  firstZodError,
  managedUserSchema,
} from "../../lib/validation";
import { logActivity } from "../../services/activityLogs";
import { adminUpdateUser } from "../../services/profiles";
import {
  assignUserRole,
  createUserWithRole,
  setUserActive,
} from "../../services/userAdmin";
import type { RoleRecord, UserProfile } from "../../types";
import { useFormat } from "../../hooks/useFormat";
import { resolveProfileRole } from "../../utils/roles";
import { computeUserStats } from "../../utils/stats";

const PAGE_SIZE = 10;

interface PendingStatus {
  user: UserProfile;
  active: boolean;
}

interface PendingRole {
  user: UserProfile;
  roleKey: string;
}

interface CreateForm {
  displayName: string;
  email: string;
  password: string;
  roleKey: string;
}

function initials(profile: UserProfile): string {
  return (profile.displayName || profile.email || "U").slice(0, 2).toUpperCase();
}

function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    switch (err.message) {
      case "self-role-change":
        return "নিজের রোল পরিবর্তন করা যাবে না";
      case "self-status-change":
        return "নিজের অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না";
      case "protected-role-change":
        return "Master Admin-এর রোল শুধু আরেকজন Master পরিবর্তন করতে পারেন";
      case "protected-status-change":
        return "Master Admin অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না";
      case "master-assignment-forbidden":
        return "শুধু Master Admin নতুন Master নিয়োগ করতে পারেন";
      case "role-inactive":
        return "নির্বাচিত রোল সক্রিয় নেই";
      default:
        return authErrorMessage(err.message);
    }
  }
  return dbErrorMessage(err);
}

export function AdminUsersPage(): ReactNode {
  const { profile: actor, roles, isMaster, can } = useAuth();
  const fmt = useFormat();
  const { profiles, loading, error } = useProfiles();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [pendingStatus, setPendingStatus] = useState<PendingStatus | null>(null);
  const [pendingRole, setPendingRole] = useState<PendingRole | null>(null);
  const [pending, setPending] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    displayName: "",
    email: "",
    password: "",
    roleKey: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [nameTarget, setNameTarget] = useState<UserProfile | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  useDocumentTitle("ইউজার ম্যানেজমেন্ট");

  const canAssign = can("users.assignRole");
  const canCreate = can("users.create");
  const canDisable = can("users.disable");
  const canEdit = can("users.edit");

  const assignable = useMemo(
    () =>
      roles.filter(
        (role) =>
          role.status === "active" &&
          role.id !== "admin" &&
          role.id !== "user" &&
          (role.id !== "master-admin" || isMaster),
      ),
    [roles, isMaster],
  );

  const stats = useMemo(() => computeUserStats(profiles), [profiles]);

  const filterRoles = useMemo(() => {
    const map = new Map<string, RoleRecord>();
    for (const role of roles) map.set(role.id, role);
    for (const profile of profiles) {
      const role = resolveProfileRole(profile, roles);
      if (!map.has(role.id)) map.set(role.id, role);
    }
    return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [roles, profiles]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return profiles.filter((profile) => {
      const roleKey = effectiveRoleKey(profile.role);
      if (roleFilter !== "all" && roleKey !== roleFilter) return false;
      if (statusFilter === "active" && !profile.active) return false;
      if (statusFilter === "inactive" && profile.active) return false;
      if (!needle) return true;
      return (
        profile.displayName.toLowerCase().includes(needle) ||
        profile.email.toLowerCase().includes(needle) ||
        profile.uid.toLowerCase().includes(needle)
      );
    });
  }, [profiles, query, roleFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const canModifyRole = (target: UserProfile): boolean => {
    if (!actor || !canAssign || target.uid === actor.uid) return false;
    if (isMasterRoleKey(target.role) && !isMaster) return false;
    return true;
  };

  const optionsFor = (target: UserProfile): RoleRecord[] => {
    const current = resolveProfileRole(target, roles);
    const map = new Map(assignable.map((role) => [role.id, role]));
    if (!map.has(current.id)) map.set(current.id, current);
    return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const confirmRole = async () => {
    if (!pendingRole || !actor) return;
    setPending(true);
    try {
      const nextRole = roles.find((role) => role.id === pendingRole.roleKey);
      await assignUserRole(
        pendingRole.user,
        pendingRole.roleKey,
        actor.uid,
        profiles,
        roles,
      );
      await logActivity(
        "user_role_assign",
        `${pendingRole.user.displayName || pendingRole.user.email} → ${nextRole?.name ?? pendingRole.roleKey}`,
        {
          targetType: "user",
          targetId: pendingRole.user.uid,
          actorRole: actor.role,
        },
      );
      toast("রোল পরিবর্তন হয়েছে", { variant: "success" });
      setPendingRole(null);
    } catch (err) {
      toast(friendlyError(err), { variant: "danger" });
    } finally {
      setPending(false);
    }
  };

  const confirmStatus = async () => {
    if (!pendingStatus || !actor) return;
    setPending(true);
    try {
      await setUserActive(pendingStatus.user, pendingStatus.active, actor.uid);
      await logActivity(
        "user_status_change",
        `${pendingStatus.user.displayName || pendingStatus.user.email} → ${
          pendingStatus.active ? "সক্রিয়" : "নিষ্ক্রিয়"
        }`,
        {
          targetType: "user",
          targetId: pendingStatus.user.uid,
          actorRole: actor.role,
        },
      );
      toast("স্ট্যাটাস পরিবর্তন হয়েছে", { variant: "success" });
      setPendingStatus(null);
    } catch (err) {
      toast(friendlyError(err), { variant: "danger" });
    } finally {
      setPending(false);
    }
  };

  const openCreate = () => {
    setCreateForm({
      displayName: "",
      email: "",
      password: "",
      roleKey: assignable.find((role) => role.id === "operator")?.id ?? assignable[0]?.id ?? "",
    });
    setCreateError(null);
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    if (!actor) return;
    setCreateError(null);
    const parsed = managedUserSchema.safeParse(createForm);
    if (!parsed.success) {
      setCreateError(firstZodError(parsed.error));
      return;
    }
    setCreating(true);
    try {
      const role = roles.find((entry) => entry.id === parsed.data.roleKey);
      await createUserWithRole(parsed.data, profiles, roles);
      await logActivity(
        "user_create",
        `নতুন ইউজার ${parsed.data.displayName} (${role?.name ?? parsed.data.roleKey}) তৈরি করা হয়েছে`,
        {
          targetType: "user",
          targetId: parsed.data.email,
          actorRole: actor.role,
        },
      );
      toast("ইউজার তৈরি হয়েছে; যাচাইয়ের ইমেইল পাঠানো হয়েছে", { variant: "success" });
      setCreateOpen(false);
    } catch (err) {
      setCreateError(friendlyError(err));
    } finally {
      setCreating(false);
    }
  };

  const openName = (target: UserProfile) => {
    setNameTarget(target);
    setNameDraft(target.displayName);
    setNameError(null);
  };

  const saveName = async () => {
    if (!nameTarget || !actor) return;
    const parsed = displayNameSchema.safeParse(nameDraft);
    if (!parsed.success) {
      setNameError(firstZodError(parsed.error));
      return;
    }
    setSavingName(true);
    try {
      await adminUpdateUser(nameTarget.uid, { displayName: parsed.data });
      await logActivity("user_edit", `${nameTarget.email} এর নাম "${parsed.data}" করা হয়েছে`, {
        targetType: "user",
        targetId: nameTarget.uid,
        actorRole: actor.role,
      });
      toast("নাম আপডেট হয়েছে", { variant: "success" });
      setNameTarget(null);
    } catch (err) {
      setNameError(friendlyError(err));
    } finally {
      setSavingName(false);
    }
  };

  if (loading) return <InlineLoader label="ইউজার লোড হচ্ছে..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="ইউজার ম্যানেজমেন্ট"
        description="ডেটাবেস-চালিত রোল assign করুন, অ্যাকাউন্ট তৈরি করুন ও স্ট্যাটাস নিয়ন্ত্রণ করুন।"
        actions={
          canCreate ? (
            <Button size="sm" variant="primary" onPress={openCreate} isDisabled={assignable.length === 0}>
              <UserPlus className="size-4" />
              নতুন ইউজার
            </Button>
          ) : undefined
        }
      />

      {!canAssign && !canDisable && !canEdit ? (
        <Alert status="default">
          <Alert.Indicator>
            <Users className="size-4" />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>শুধুমাত্র দেখা</Alert.Title>
            <Alert.Description>
              আপনার রোলে ইউজার পরিবর্তনের অনুমতি নেই। যোগাযোগ করুন Master Admin-এর সঙ্গে।
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="মোট ইউজার" value={stats.totalUsers} icon={Users} tone="accent" />
        <StatCard label="সক্রিয়" value={stats.activeUsers} icon={UserCheck} tone="success" />
        <StatCard label="নিষ্ক্রিয়" value={stats.inactiveUsers} icon={UserX} tone="danger" />
        <StatCard label="অ্যাডমিন" value={stats.admins} icon={ShieldCheck} tone="warning" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="নাম, ইমেইল বা UID..."
          className="sm:max-w-sm"
        />
        <div className="flex flex-wrap items-end gap-2">
          <Select
            name="role-filter"
            selectedKey={roleFilter}
            onSelectionChange={(key) => {
              setRoleFilter(String(key));
              setPage(1);
            }}
            className="w-44"
          >
            <Label>রোল</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue="সব রোল">
                  সব রোল
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {filterRoles.map((role) => (
                  <ListBox.Item key={role.id} id={role.id} textValue={role.name}>
                    {role.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          {(
            [
              { key: "all", label: "সব" },
              { key: "active", label: "সক্রিয়" },
              { key: "inactive", label: "নিষ্ক্রিয়" },
            ] as const
          ).map((option) => (
            <Button
              key={option.key}
              size="sm"
              variant={statusFilter === option.key ? "primary" : "secondary"}
              onPress={() => {
                setStatusFilter(option.key);
                setPage(1);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="কোনো ইউজার পাওয়া যায়নি" description="ফিল্টার পরিবর্তন করে দেখুন।" />
      ) : (
        <Card>
          <Card.Content className="p-0">
            <div className="hidden lg:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-muted border-b text-xs uppercase">
                    <th className="px-4 py-3 font-medium">ব্যবহারকারী</th>
                    <th className="px-4 py-3 font-medium">রোল</th>
                    <th className="px-4 py-3 font-medium">স্ট্যাটাস</th>
                    <th className="px-4 py-3 font-medium">তৈরি / সর্বশেষ লগইন</th>
                    <th className="px-4 py-3 text-right font-medium">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((profile) => {
                    const isSelf = profile.uid === actor?.uid;
                    const current = resolveProfileRole(profile, roles);
                    const options = optionsFor(profile);
                    const roleLocked = !canModifyRole(profile);
                    const statusLocked =
                      !canDisable || isSelf || isMasterRoleKey(profile.role);
                    return (
                      <tr key={profile.uid} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar size="sm">
                              <Avatar.Fallback>{initials(profile)}</Avatar.Fallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {profile.displayName || "—"}
                                {isSelf ? <span className="text-muted"> (আপনি)</span> : null}
                              </p>
                              <p className="text-muted truncate text-xs">{profile.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {canAssign ? (
                            <Select
                              name={`role-${profile.uid}`}
                              selectedKey={current.id}
                              isDisabled={roleLocked}
                              onSelectionChange={(key) => {
                                const roleKey = String(key);
                                if (roleKey !== current.id) {
                                  setPendingRole({ user: profile, roleKey });
                                }
                              }}
                            >
                              <Select.Trigger className="min-w-40">
                                <Select.Value />
                                <Select.Indicator />
                              </Select.Trigger>
                              <Select.Popover>
                                <ListBox>
                                  {options.map((role) => (
                                    <ListBox.Item key={role.id} id={role.id} textValue={role.name}>
                                      <span className="inline-flex items-center gap-2">
                                        <RoleBadge role={role} />
                                      </span>
                                      <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                  ))}
                                </ListBox>
                              </Select.Popover>
                            </Select>
                          ) : (
                            <RoleBadge role={current} />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ActiveBadge active={profile.active} />
                        </td>
                        <td className="text-muted px-4 py-3 text-xs">
                          {fmt.dateFull(profile.createdAt)}
                          <span className="block">লগইন: {fmt.timestamp(profile.lastLogin)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {canEdit && !isSelf ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                isIconOnly
                                aria-label={`${profile.displayName} এর নাম সম্পাদনা`}
                                onPress={() => openName(profile)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant={profile.active ? "danger-soft" : "tertiary"}
                              isDisabled={statusLocked}
                              onPress={() =>
                                setPendingStatus({ user: profile, active: !profile.active })
                              }
                            >
                              {profile.active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 p-3 lg:hidden">
              {pageItems.map((profile) => {
                const isSelf = profile.uid === actor?.uid;
                const current = resolveProfileRole(profile, roles);
                const options = optionsFor(profile);
                const roleLocked = !canModifyRole(profile);
                const statusLocked = !canDisable || isSelf || isMasterRoleKey(profile.role);
                return (
                  <div key={profile.uid} className="bg-surface rounded-xl border p-3">
                    <div className="flex items-start gap-3">
                      <Avatar size="sm">
                        <Avatar.Fallback>{initials(profile)}</Avatar.Fallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {profile.displayName || "—"}
                          {isSelf ? <span className="text-muted"> (আপনি)</span> : null}
                        </p>
                        <p className="text-muted truncate text-xs">{profile.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <RoleBadge role={current} />
                          <ActiveBadge active={profile.active} />
                        </div>
                        <p className="text-muted mt-2 text-xs">
                          লগইন: {fmt.timestamp(profile.lastLogin)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {canAssign ? (
                            <Select
                              name={`m-role-${profile.uid}`}
                              selectedKey={current.id}
                              isDisabled={roleLocked}
                              onSelectionChange={(key) => {
                                const roleKey = String(key);
                                if (roleKey !== current.id) {
                                  setPendingRole({ user: profile, roleKey });
                                }
                              }}
                            >
                              <Select.Trigger className="min-w-40">
                                <Select.Value />
                                <Select.Indicator />
                              </Select.Trigger>
                              <Select.Popover>
                                <ListBox>
                                  {options.map((role) => (
                                    <ListBox.Item key={role.id} id={role.id} textValue={role.name}>
                                      {role.name}
                                      <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                  ))}
                                </ListBox>
                              </Select.Popover>
                            </Select>
                          ) : null}
                          {canEdit && !isSelf ? (
                            <Button size="sm" variant="secondary" onPress={() => openName(profile)}>
                              <Pencil className="size-4" />
                              নাম
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant={profile.active ? "danger-soft" : "secondary"}
                            isDisabled={statusLocked}
                            onPress={() =>
                              setPendingStatus({ user: profile, active: !profile.active })
                            }
                          >
                            {profile.active ? "নিষ্ক্রিয়" : "সক্রিয়"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      <Modal isOpen={createOpen} onOpenChange={setCreateOpen}>
        <Modal.Backdrop>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>নতুন ইউজার</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4">
                <TextField
                  name="new-user-name"
                  isRequired
                  value={createForm.displayName}
                  onChange={(displayName) =>
                    setCreateForm((prev) => ({ ...prev, displayName }))
                  }
                >
                  <Label>নাম</Label>
                  <Input placeholder="নাম" />
                </TextField>
                <TextField
                  name="new-user-email"
                  isRequired
                  value={createForm.email}
                  onChange={(email) => setCreateForm((prev) => ({ ...prev, email }))}
                >
                  <Label>ইমেইল</Label>
                  <Input type="email" placeholder="user@example.com" />
                </TextField>
                <TextField
                  name="new-user-password"
                  isRequired
                  value={createForm.password}
                  onChange={(password) => setCreateForm((prev) => ({ ...prev, password }))}
                >
                  <Label>পাসওয়ার্ড</Label>
                  <Input type="password" placeholder="কমপক্ষে ৮ অক্ষর" />
                  <Description>পাসওয়ার্ড শুধু Firebase Auth-এ যাবে, ডেটাবেসে সংরক্ষিত হবে না</Description>
                </TextField>
                <Select
                  name="new-user-role"
                  selectedKey={createForm.roleKey}
                  onSelectionChange={(key) =>
                    setCreateForm((prev) => ({ ...prev, roleKey: String(key) }))
                  }
                >
                  <Label>রোল</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {assignable.map((role) => (
                        <ListBox.Item key={role.id} id={role.id} textValue={role.name}>
                          {role.name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
                {createError ? <FieldError>{createError}</FieldError> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={() => setCreateOpen(false)} isDisabled={creating}>
                  বাতিল
                </Button>
                <Button isPending={creating} onPress={() => void submitCreate()}>
                  <UserPlus className="size-4" />
                  তৈরি করুন
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal
        isOpen={Boolean(nameTarget)}
        onOpenChange={(open) => {
          if (!open) setNameTarget(null);
        }}
      >
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>নাম সম্পাদনা</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <TextField
                  name="edit-user-name"
                  isRequired
                  value={nameDraft}
                  onChange={setNameDraft}
                  isInvalid={Boolean(nameError)}
                >
                  <Label>নতুন নাম</Label>
                  <Input />
                  {nameError ? <FieldError>{nameError}</FieldError> : null}
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={() => setNameTarget(null)} isDisabled={savingName}>
                  বাতিল
                </Button>
                <Button isPending={savingName} onPress={() => void saveName()}>
                  সংরক্ষণ
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(pendingRole)}
        onOpenChange={(open) => {
          if (!open) setPendingRole(null);
        }}
        title="রোল পরিবর্তন করবেন?"
        message={
          pendingRole
            ? `${pendingRole.user.displayName || pendingRole.user.email} কে "${
                roles.find((role) => role.id === pendingRole.roleKey)?.name ?? pendingRole.roleKey
              }" রোল দেওয়া হবে।`
            : ""
        }
        confirmLabel="পরিবর্তন করুন"
        danger={false}
        pending={pending}
        onConfirm={confirmRole}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingStatus)}
        onOpenChange={(open) => {
          if (!open) setPendingStatus(null);
        }}
        title={pendingStatus?.active ? "সক্রিয় করবেন?" : "নিষ্ক্রিয় করবেন?"}
        message={
          pendingStatus
            ? `${pendingStatus.user.displayName || pendingStatus.user.email} এর অ্যাকাউন্ট ${
                pendingStatus.active ? "সক্রিয়" : "নিষ্ক্রিয়"
              } করা হবে।`
            : ""
        }
        confirmLabel="নিশ্চিত করুন"
        danger={pendingStatus?.active === false}
        pending={pending}
        onConfirm={confirmStatus}
      />
    </div>
  );
}
