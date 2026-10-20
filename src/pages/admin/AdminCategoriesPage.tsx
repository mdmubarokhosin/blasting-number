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
  ArrowRightLeft,
  Check,
  Pencil,
  Plus,
  Sparkles,
  Tags,
  Trash2,
} from "../../components/icons";
import { type ReactNode, useMemo, useState } from "react";
import { ColorField, IconField } from "../../components/admin/AppearanceFields";
import { CategoryBadge } from "../../components/common/Badges";
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
  categoryKeySchema,
  categoryDetailsSchema,
  dbErrorMessage,
  firstZodError,
} from "../../lib/validation";
import { logActivity } from "../../services/activityLogs";
import {
  createCategory,
  deleteCategory,
  migrateLegacyCategoryReferences,
  seedDefaultCategories,
  updateCategory,
  updateCategoryStatus,
  type CategoryDraft,
} from "../../services/categories";
import type { CategoryRecord, CategoryStatus } from "../../types";
import { categoryUsage } from "../../utils/categories";

interface CategoryForm {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: CategoryStatus;
  sortOrder: number;
}

function emptyForm(sortOrder: number): CategoryForm {
  return {
    id: "",
    name: "",
    description: "",
    color: "#2563eb",
    icon: "tag",
    status: "active",
    sortOrder,
  };
}

export function AdminCategoriesPage(): ReactNode {
  const { categories, categoriesReady, categoriesError, profile, can } = useAuth();
  const { ui } = useSite();
  const canViewLists = can("lists.view");
  const { lists, loading: listsLoading } = useLists(canViewLists);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRecord | null>(null);
  const [form, setForm] = useState<CategoryForm>(() => emptyForm(categories.length));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [migrating, setMigrating] = useState(false);
  useDocumentTitle("ক্যাটাগরি");

  const canAppearance = can("categories.manageAppearance");
  const canDeleteCategory = can("categories.delete") && canViewLists;
  const usage = useMemo(() => categoryUsage(lists, categories), [lists, categories]);
  const usageById = useMemo(
    () => new Map(usage.map((entry) => [entry.category.id, entry])),
    [usage],
  );
  const legacyEntries = usage.filter((entry) => entry.legacy);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(categories.length));
    setError(null);
    setEditorOpen(true);
  };

  const openEdit = (category: CategoryRecord) => {
    setEditing(category);
    setForm({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      status: category.status,
      sortOrder: category.sortOrder,
    });
    setError(null);
    setEditorOpen(true);
  };

  const save = async () => {
    setError(null);
    const parsed = categoryDetailsSchema.safeParse({
      name: form.name,
      slug: form.id,
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
      const idParsed = categoryKeySchema.safeParse(form.id);
      if (!idParsed.success) {
        setError(firstZodError(idParsed.error));
        return;
      }
      if (categories.some((category) => category.id === idParsed.data)) {
        setError("এই ক্যাটাগরি key ইতিমধ্যে ব্যবহার করা হয়েছে");
        return;
      }
    }
    if (!profile) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, {
          ...parsed.data,
          slug: editing.slug,
        } as Omit<CategoryDraft, "id">);
        await logActivity("category_update", `ক্যাটাগরি "${parsed.data.name}" আপডেট করা হয়েছে`, {
          targetType: "category",
          targetId: editing.id,
          actorRole: profile.role,
        });
        toast("ক্যাটাগরি আপডেট হয়েছে", { variant: "success" });
      } else {
        await createCategory(
          { id: form.id.trim().toLowerCase(), ...parsed.data },
          profile.uid,
        );
        await logActivity("category_create", `নতুন ক্যাটাগরি "${parsed.data.name}" তৈরি করা হয়েছে`, {
          targetType: "category",
          targetId: form.id.trim().toLowerCase(),
          actorRole: profile.role,
        });
        toast("ক্যাটাগরি তৈরি হয়েছে", { variant: "success" });
      }
      setEditorOpen(false);
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (category: CategoryRecord, active: boolean) => {
    try {
      await updateCategoryStatus(category.id, active ? "active" : "inactive");
      await logActivity("category_update", `ক্যাটাগরি "${category.name}" ${active ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে`, {
        targetType: "category",
        targetId: category.id,
        actorRole: profile?.role,
      });
      toast("স্ট্যাটাস পরিবর্তন হয়েছে", { variant: "success" });
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      await logActivity("category_delete", `ক্যাটাগরি "${deleteTarget.name}" মুছে ফেলা হয়েছে`, {
        targetType: "category",
        targetId: deleteTarget.id,
        actorRole: profile?.role,
      });
      toast("ক্যাটাগরি মুছে ফেলা হয়েছে", { variant: "success" });
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
      const created = await seedDefaultCategories(profile.uid);
      await logActivity("category_seed", `${created}টি ডিফল্ট ক্যাটাগরি সিড করা হয়েছে`);
      toast(created > 0 ? `${created}টি ক্যাটাগরি তৈরি হয়েছে` : "সব ডিফল্ট ক্যাটাগরি আগে থেকেই আছে", {
        variant: "success",
      });
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
    } finally {
      setSeeding(false);
    }
  };

  const migrate = async () => {
    if (!profile) return;
    setMigrating(true);
    try {
      const count = await migrateLegacyCategoryReferences(lists, categories);
      await logActivity("category_migrate", `${count}টি পুরনো আইটেমে categoryId যোগ করা হয়েছে`);
      toast(
        count > 0 ? `${count}টি আইটেম মাইগ্রেট হয়েছে` : "মাইগ্রেট করার মতো পুরনো আইটেম নেই",
        { variant: "success" },
      );
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
    } finally {
      setMigrating(false);
    }
  };

  if (!categoriesReady) return <InlineLoader label="ক্যাটাগরি লোড হচ্ছে..." />;
  if (categoriesError) return <ErrorState message={categoriesError} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="ক্যাটাগরি"
        description="ক্যাটাগরির নাম, রঙ, আইকন, ক্রম ও স্ট্যাটাস ডেটাবেস থেকে পরিচালনা করুন।"
        actions={
          <>
            {can("categories.create") ? (
              <Button size="sm" variant="secondary" isPending={seeding} onPress={() => void seed()}>
                <Sparkles className="size-4" />
                ডিফল্ট
              </Button>
            ) : null}
            {can("lists.editAny") ? (
              <Button
                size="sm"
                variant="secondary"
                isPending={migrating}
                isDisabled={listsLoading || lists.length === 0 || categories.length === 0}
                onPress={() => void migrate()}
              >
                <ArrowRightLeft className="size-4" />
                পুরনো ডেটা মাইগ্রেট
              </Button>
            ) : null}
            {can("categories.create") ? (
              <Button size="sm" variant="primary" onPress={openCreate}>
                <Plus className="size-4" />
                নতুন ক্যাটাগরি
              </Button>
            ) : null}
          </>
        }
      />

      {legacyEntries.length > 0 ? (
        <Alert status="warning">
          <Alert.Indicator>
            <Tags className="size-4" />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>পুরনো ক্যাটাগরি পাওয়া গেছে</Alert.Title>
            <Alert.Description>
              {legacyEntries.map((entry) => entry.category.name).join(", ")} — নাম মিলিয়ে উপরে
              “পুরনো ডেটা মাইগ্রেট” চাপুন, অথবা একই নামে ক্যাটাগরি তৈরি করুন।
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="কোনো ক্যাটাগরি নেই"
          description="ডিফল্ট ক্যাটাগরি সিড করুন অথবা নিজের প্রথম ক্যাটাগরি তৈরি করুন।"
          action={
            can("categories.create") ? (
              <Button onPress={() => void seed()} isPending={seeding}>
                <Sparkles className="size-4" />
                ডিফল্ট ক্যাটাগরি সিড করুন
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bn-card-grid sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const count = usageById.get(category.id)?.count ?? 0;
            const active = category.status === "active";
            return (
              <Card
                key={category.id}
                className={`bn-card bn-card-center${active ? "" : " opacity-70"}`}
              >
                <Card.Header>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <CategoryBadge category={category} />
                    {!active ? (
                      <Chip size="sm" variant="soft" color="danger">
                        <Chip.Label>নিষ্ক্রিয়</Chip.Label>
                      </Chip>
                    ) : null}
                  </div>
                  <Card.Description>
                    <span className="font-mono text-xs">
                      {category.id} · {count} আইটেম
                    </span>
                  </Card.Description>
                </Card.Header>
                <Card.Content className="flex flex-col items-center gap-3">
                  <p className="text-muted min-h-8 text-sm">{category.description || "—"}</p>
                  <p className="text-muted text-center text-xs">
                    ক্রম {category.sortOrder} · slug <span className="font-mono">{category.slug}</span>
                  </p>
                  {can("categories.edit") ? (
                    <Switch
                      isSelected={active}
                      onChange={(selected) => void toggleStatus(category, selected)}
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Switch.Content>
                        <Label>{active ? "সক্রিয়" : "নিষ্ক্রিয়"}</Label>
                        <Description>নিষ্ক্রিয় ক্যাটাগরিতে নতুন আইটেম যোগ করা যাবে না</Description>
                      </Switch.Content>
                    </Switch>
                  ) : null}
                </Card.Content>
                {can("categories.edit") ? (
                  <Card.Footer>
                    <div className="bn-card-actions">
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`${category.name} সম্পাদনা`}
                        onPress={() => openEdit(category)}
                      >
                        <Pencil className="size-4" />
                        সম্পাদনা
                      </Button>
                      <Button
                        size="sm"
                        variant="danger-soft"
                        aria-label={`${category.name} মুছুন`}
                        isDisabled={listsLoading || count > 0 || !canDeleteCategory}
                        onPress={() => setDeleteTarget(category)}
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
                <Modal.Heading>{editing ? "ক্যাটাগরি সম্পাদনা" : "নতুন ক্যাটাগরি"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4 overflow-y-auto">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    name="category-id"
                    isRequired
                    isDisabled={Boolean(editing)}
                    value={form.id}
                    onChange={(id) => setForm((prev) => ({ ...prev, id }))}
                  >
                    <Label>{ui("ক্যাটাগরি কী / slug")}</Label>
                    <Input placeholder="packaging" className="font-mono" />
                    <Description>ইংরেজি lowercase, সংখ্যা ও হাইফেন; পরে বদলানো যাবে না</Description>
                  </TextField>
                  <TextField
                    name="category-name"
                    isRequired
                    value={form.name}
                    onChange={(name) => setForm((prev) => ({ ...prev, name }))}
                  >
                    <Label>নাম</Label>
                    <Input placeholder="Packaging" />
                  </TextField>
                </div>

                <TextField
                  name="category-description"
                  value={form.description}
                  onChange={(description) => setForm((prev) => ({ ...prev, description }))}
                >
                  <Label>বিবরণ</Label>
                  <Input placeholder="এই ক্যাটাগরির ব্যবহার..." />
                </TextField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorField
                    color={form.color}
                    isDisabled={!canAppearance}
                    onChange={(color) => setForm((prev) => ({ ...prev, color }))}
                  />
                  <TextField
                    name="category-sort"
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
                  isDisabled={!canAppearance}
                  onChange={(icon) => setForm((prev) => ({ ...prev, icon }))}
                />

                {!canAppearance ? (
                  <p className="text-muted text-xs">
                    রঙ ও আইকন পরিবর্তনের জন্য “রঙ ও আইকন নিয়ন্ত্রণ” অনুমতি প্রয়োজন।
                  </p>
                ) : null}

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
                    <Label>সক্রিয় ক্যাটাগরি</Label>
                    <Description>নিষ্ক্রিয় ক্যাটাগরি নতুন আইটেমে দেখা যাবে না</Description>
                  </Switch.Content>
                </Switch>

                {error ? <FieldError>{error}</FieldError> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={() => setEditorOpen(false)} isDisabled={saving}>
                  বাতিল
                </Button>
                <Button isPending={saving} onPress={() => void save()}>
                  <Check className="size-4" />
                  {editing ? "সংরক্ষণ করুন" : "ক্যাটাগরি তৈরি করুন"}
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
        title="ক্যাটাগরি মুছে ফেলবেন?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" মুছে ফেলা হবে। কোনো আইটেমে ব্যবহৃত থাকলে মুছে ফেলা যাবে না।`
            : ""
        }
        confirmLabel="মুছে ফেলুন"
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
