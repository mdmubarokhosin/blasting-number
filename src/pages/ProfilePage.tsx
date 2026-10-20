import {
  Avatar,
  Button,
  Card,
  Chip,
  FieldError,
  Input,
  Label,
  Separator,
  TextField,
} from "@heroui/react";
import {
  BadgeCheck,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MailWarning,
  Save,
  ShieldCheck,
} from "../components/icons";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "@heroui/react";
import { ActiveBadge, RoleBadge } from "../components/common/Badges";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { useAuth } from "../features/auth/AuthProvider";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useLists } from "../hooks/useLists";
import { displayNameSchema, firstZodError } from "../lib/validation";
import { useFormat } from "../hooks/useFormat";
import { computeListStats } from "../utils/stats";
import { resolveProfileRole } from "../utils/roles";

export function ProfilePage(): ReactNode {
  const {
    user,
    profile,
    roles,
    can,
    logout,
    updateName,
    sendVerificationEmail,
    sendPasswordReset,
  } = useAuth();
  const fmt = useFormat();
  const canViewLists = can("lists.view");
  const { lists } = useLists(canViewLists);
  const [name, setName] = useState(profile?.displayName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useDocumentTitle("প্রোফাইল");

  const myStats = useMemo(() => {
    const mine = profile ? lists.filter((list) => list.ownerId === profile.uid) : [];
    return computeListStats(mine);
  }, [lists, profile]);

  const initials = (profile?.displayName || user?.email || "U").slice(0, 2).toUpperCase();

  const submitName = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsed = displayNameSchema.safeParse(name);
    if (!parsed.success) {
      setError(firstZodError(parsed.error));
      return;
    }
    setSaving(true);
    try {
      await updateName(parsed.data);
      toast("নাম আপডেট হয়েছে", { variant: "success" });
    } catch {
      toast("নাম আপডেট করা যায়নি", { variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  if (!profile || !user) return null;

  return (
    <div className="bn-page mx-auto w-full max-w-3xl">
      <PageHeader
        title="প্রোফাইল"
        description="আপনার অ্যাকাউন্ট তথ্য ও নিরাপত্তা সেটিংস।"
        align="center"
      />

      <Card className="bn-card bn-card-center">
        <Card.Content className="flex flex-col items-center gap-4 p-6 text-center">
          <Avatar size="lg">
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{profile.displayName || "—"}</p>
            <p className="text-muted truncate text-sm">{profile.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <RoleBadge role={resolveProfileRole(profile, roles)} />
              <ActiveBadge active={profile.active} />
              {user.emailVerified ? (
                <Chip size="sm" variant="soft" color="success">
                  <Chip.Label>
                    <span className="inline-flex items-center gap-1">
                      <BadgeCheck className="size-3.5" /> ইমেইল যাচাইকৃত
                    </span>
                  </Chip.Label>
                </Chip>
              ) : (
                <Chip size="sm" variant="soft" color="warning">
                  <Chip.Label>
                    <span className="inline-flex items-center gap-1">
                      <MailWarning className="size-3.5" /> ইমেইল অযাচাইকৃত
                    </span>
                  </Chip.Label>
                </Chip>
              )}
            </div>
          </div>
          {can("dashboard.view") ? (
            <Link
              to="/admin"
              className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
            >
              <LayoutDashboard className="size-4" />
              অ্যাডমিন প্যানেল
            </Link>
          ) : null}
        </Card.Content>
      </Card>

      {canViewLists ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="আমার তালিকা" value={myStats.totalLists} icon={ListChecks} tone="accent" />
          <StatCard label="আমার আইটেম" value={myStats.totalItems} icon={ListChecks} tone="success" />
          <div className="col-span-2 sm:col-span-1">
            <StatCard
              label="আজকের তালিকা"
              value={myStats.todayLists}
              icon={ListChecks}
              tone="warning"
            />
          </div>
        </div>
      ) : null}

      <Card className="bn-card--form">
        <Card.Header className="items-center text-center">
          <Card.Title className="text-base">নাম পরিবর্তন</Card.Title>
          <Card.Description>এই নামটি তালিকা ও অ্যাক্টিভিটি লগে দেখানো হবে।</Card.Description>
        </Card.Header>
        <Card.Content>
          <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={submitName}>
            <TextField
              name="displayName"
              className="flex-1"
              isRequired
              value={name}
              onChange={setName}
              isInvalid={Boolean(error)}
            >
              <Label>পূর্ণ নাম</Label>
              <Input placeholder="আপনার নাম" />
              {error ? <FieldError>{error}</FieldError> : null}
            </TextField>
            <Button type="submit" isPending={saving}>
              {({ isPending }) => (
                <>
                  {!isPending ? <Save className="size-4" /> : null}
                  সংরক্ষণ
                </>
              )}
            </Button>
          </form>
        </Card.Content>
      </Card>

      <Card className="bn-card--form">
        <Card.Header className="items-center text-center">
          <Card.Title className="text-base">নিরাপত্তা</Card.Title>
          <Card.Description>পাসওয়ার্ড ও ইমেইল যাচাই সংক্রান্ত।</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4" />
                পাসওয়ার্ড রিসেট
              </p>
              <p className="text-muted text-xs">আপনার ইমেইলে রিসেট লিংক পাঠানো হবে।</p>
            </div>
            <Button
              variant="secondary"
              onPress={() => void sendPasswordReset(profile.email).catch(() => undefined)}
            >
              <KeyRound className="size-4" />
              রিসেট লিংক
            </Button>
          </div>
          {!user.emailVerified ? (
            <>
              <Separator />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <MailWarning className="size-4" />
                    ইমেইল যাচাই
                  </p>
                  <p className="text-muted text-xs">যাচাইয়ের লিংক পুনরায় পাঠান।</p>
                </div>
                <Button
                  variant="secondary"
                  onPress={() => void sendVerificationEmail().catch(() => undefined)}
                >
                  যাচাইয়ের লিংক পাঠান
                </Button>
              </div>
            </>
          ) : null}
          <Separator />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">অ্যাকাউন্ট তথ্য</p>
              <p className="text-muted text-xs">
                তৈরি: {fmt.dateFull(profile.createdAt)} · সর্বশেষ লগইন:{" "}
                {fmt.dateFull(profile.lastLogin)}
              </p>
            </div>
            <Button variant="danger-soft" onPress={() => void logout()}>
              <LogOut className="size-4" />
              লগআউট
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
