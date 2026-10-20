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
  Database,
  Globe,
  Languages as LanguagesIcon,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Star,
  Trash2,
} from "../../components/icons";
import { type ReactNode, useMemo, useState } from "react";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState } from "../../components/common/EmptyState";
import { PageHeader } from "../../components/common/PageHeader";
import { PaginationBar } from "../../components/common/PaginationBar";
import { SearchInput } from "../../components/common/SearchInput";
import { useAuth } from "../../features/auth/AuthProvider";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useSite } from "../../i18n/SiteProvider";
import { UI_CATALOG } from "../../i18n/uiCatalog";
import {
  dbErrorMessage,
  firstZodError,
  languageDetailsSchema,
} from "../../lib/validation";
import { logActivity } from "../../services/activityLogs";
import {
  BASE_LANGUAGE_CODES,
  createLanguage,
  deleteLanguage,
  saveTranslationValues,
  seedDefaultLanguages,
  seedTranslations,
  setDefaultLanguage,
  translationStorageKey,
  updateLanguage,
  type LanguageDraft,
} from "../../services/languages";
import type { LanguageRecord } from "../../types";

const PAGE_SIZE = 20;

interface LanguageForm extends LanguageDraft {
  originalCode: string;
}

function emptyForm(sortOrder: number): LanguageForm {
  return {
    originalCode: "",
    code: "",
    name: "",
    nativeName: "",
    direction: "ltr",
    status: "active",
    sortOrder,
  };
}

function languageError(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  switch (code) {
    case "invalid-language-code":
      return "ভাষা কোড সঠিক নয়";
    case "language-already-exists":
      return "এই ভাষা কোড ইতিমধ্যে আছে";
    case "language-code-immutable":
      return "ভাষা কোড পরে বদলানো যাবে না";
    case "language-not-found":
      return "ভাষা পাওয়া যায়নি";
    case "default-language-must-stay-active":
      return "ডিফল্ট ভাষা নিষ্ক্রিয় করা যাবে না";
    case "default-language-delete-blocked":
      return "ডিফল্ট ভাষা মুছে ফেলা যাবে না";
    case "protected-language":
      return "সিস্টেম ভাষা মুছে ফেলা যাবে না";
    case "last-language":
      return "শেষ ভাষা মুছে ফেলা যাবে না";
    default:
      return dbErrorMessage(error);
  }
}

export function AdminLanguagesPage(): ReactNode {
  const { profile, can } = useAuth();
  const {
    languages,
    translations,
    activeLanguages,
  } = useSite();
  const canEdit = can("settings.edit");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<LanguageRecord | null>(null);
  const [form, setForm] = useState<LanguageForm>(() => emptyForm(languages.length));
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LanguageRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [defaulting, setDefaulting] = useState<string | null>(null);

  const [translationLanguage, setTranslationLanguage] = useState("bn");
  const [translationQuery, setTranslationQuery] = useState("");
  const [translationPage, setTranslationPage] = useState(1);
  const [translationDraft, setTranslationDraft] = useState<Record<string, Record<string, string>>>({});
  const [savingTranslations, setSavingTranslations] = useState(false);
  useDocumentTitle("ভাষা ও অনুবাদ");

  const translationRows = useMemo(() => {
    const needle = translationQuery.trim().toLowerCase();
    if (!needle) return UI_CATALOG;
    return UI_CATALOG.filter(
      (entry) =>
        entry.bn.toLowerCase().includes(needle) ||
        entry.en.toLowerCase().includes(needle) ||
        entry.key.toLowerCase().includes(needle),
    );
  }, [translationQuery]);

  const translationPageCount = Math.max(1, Math.ceil(translationRows.length / PAGE_SIZE));
  const safeTranslationPage = Math.min(translationPage, translationPageCount);
  const translationPageRows = translationRows.slice(
    (safeTranslationPage - 1) * PAGE_SIZE,
    safeTranslationPage * PAGE_SIZE,
  );

  const changedTranslationCount = useMemo(
    () =>
      Object.values(translationDraft).reduce(
        (total, values) => total + Object.keys(values).length,
        0,
      ),
    [translationDraft],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(languages.length));
    setFormError(null);
    setEditorOpen(true);
  };

  const openEdit = (language: LanguageRecord) => {
    setEditing(language);
    setForm({
      originalCode: language.code,
      code: language.code,
      name: language.name,
      nativeName: language.nativeName,
      direction: language.direction,
      status: language.status,
      sortOrder: language.sortOrder,
    });
    setFormError(null);
    setEditorOpen(true);
  };

  const save = async () => {
    const parsed = languageDetailsSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(firstZodError(parsed.error));
      return;
    }
    if (!profile?.uid) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await updateLanguage(editing.code, parsed.data, profile.uid);
        await logActivity(
          "language_update",
          `ভাষা "${parsed.data.name}" (${editing.code}) আপডেট করা হয়েছে`,
          { targetType: "language", targetId: editing.code },
        );
      } else {
        await createLanguage(parsed.data, profile.uid);
        await logActivity(
          "language_create",
          `নতুন ভাষা "${parsed.data.name}" (${parsed.data.code}) যোগ করা হয়েছে`,
          { targetType: "language", targetId: parsed.data.code },
        );
      }
      toast("ভাষা সংরক্ষিত হয়েছে", { variant: "success" });
      setEditorOpen(false);
    } catch (error) {
      setFormError(languageError(error));
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (language: LanguageRecord) => {
    setDefaulting(language.code);
    try {
      await setDefaultLanguage(language.code);
      await logActivity(
        "language_default",
        `"${language.name}" ডিফল্ট ভাষা করা হয়েছে`,
        { targetType: "language", targetId: language.code },
      );
      toast("ডিফল্ট ভাষা পরিবর্তন হয়েছে", { variant: "success" });
    } catch (error) {
      toast(languageError(error), { variant: "danger" });
    } finally {
      setDefaulting(null);
    }
  };

  const toggleStatus = async (language: LanguageRecord) => {
    if (!profile?.uid) return;
    const nextStatus = language.status === "active" ? "inactive" : "active";
    try {
      await updateLanguage(
        language.code,
        {
          code: language.code,
          name: language.name,
          nativeName: language.nativeName,
          direction: language.direction,
          status: nextStatus,
          sortOrder: language.sortOrder,
        },
        profile.uid,
      );
      await logActivity(
        "language_update",
        `ভাষা "${language.name}" ${nextStatus === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে`,
        { targetType: "language", targetId: language.code },
      );
      toast("ভাষার স্ট্যাটাস পরিবর্তন হয়েছে", { variant: "success" });
    } catch (error) {
      toast(languageError(error), { variant: "danger" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLanguage(deleteTarget.code);
      await logActivity(
        "language_delete",
        `ভাষা "${deleteTarget.name}" (${deleteTarget.code}) মুছে ফেলা হয়েছে`,
        { targetType: "language", targetId: deleteTarget.code },
      );
      toast("ভাষা মুছে ফেলা হয়েছে", { variant: "success" });
      setDeleteTarget(null);
    } catch (error) {
      toast(languageError(error), { variant: "danger" });
    } finally {
      setDeleting(false);
    }
  };

  const seed = async () => {
    if (!profile?.uid) return;
    setSeeding(true);
    try {
      const languagesAdded = await seedDefaultLanguages(profile.uid);
      const translationsAdded = await seedTranslations(["en", "bn"]);
      await logActivity(
        "language_update",
        `ডিফল্ট ভাষা সিড (${languagesAdded}) ও অনুবাদ সিড (${translationsAdded}) সম্পন্ন`,
        { targetType: "settings", targetId: "languages" },
      );
      toast(
        languagesAdded + translationsAdded > 0
          ? "ডিফল্ট ভাষা ও অনুবাদ ডেটাবেসে সংরক্ষণ করা হয়েছে"
          : "ডিফল্ট ভাষা ও অনুবাদ আগে থেকেই আছে",
        { variant: "success" },
      );
    } catch (error) {
      toast(dbErrorMessage(error), { variant: "danger" });
    } finally {
      setSeeding(false);
    }
  };

  const translationValue = (key: string, bn: string, en: string): string => {
    const written = translationDraft[key]?.[translationLanguage];
    if (written !== undefined) return written;
    const stored = translations[translationStorageKey(key)]?.[translationLanguage];
    if (typeof stored === "string" && stored.length > 0) return stored;
    if (translationLanguage === "bn") return bn;
    if (translationLanguage === "en") return en;
    return en;
  };

  const setTranslation = (key: string, value: string) => {
    setTranslationDraft((previous) => ({
      ...previous,
      [key]: { ...(previous[key] ?? {}), [translationLanguage]: value },
    }));
  };

  const saveUiTranslations = async () => {
    const values: Record<string, Record<string, string>> = {};
    for (const [key, byLanguage] of Object.entries(translationDraft)) {
      const value = byLanguage[translationLanguage];
      if (value !== undefined) values[key] = { [translationLanguage]: value };
    }
    if (Object.keys(values).length === 0) return;
    setSavingTranslations(true);
    try {
      await saveTranslationValues(values);
      await logActivity(
        "translation_update",
        `${Object.keys(values).length}টি ইন্টারফেস অনুবাদ (${translationLanguage}) আপডেট করা হয়েছে`,
        { targetType: "translation", targetId: translationLanguage },
      );
      setTranslationDraft((previous) => {
        const next = { ...previous };
        for (const key of Object.keys(values)) {
          const remaining = { ...(next[key] ?? {}) };
          delete remaining[translationLanguage];
          if (Object.keys(remaining).length > 0) next[key] = remaining;
          else delete next[key];
        }
        return next;
      });
      toast("ইন্টারফেস অনুবাদ সংরক্ষিত হয়েছে", { variant: "success" });
    } catch (error) {
      toast(dbErrorMessage(error), { variant: "danger" });
    } finally {
      setSavingTranslations(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="ভাষা ও অনুবাদ"
        description="ভাষা যোগ, সক্রিয়/নিষ্ক্রিয়, ডিফল্ট নির্বাচন এবং ইন্টারফেসের সব লেখা অনুবাদ করুন।"
        actions={
          canEdit ? (
            <>
              <Button size="sm" variant="secondary" isPending={seeding} onPress={() => void seed()}>
                <Database className="size-4" />
                ডিফল্ট সিড
              </Button>
              <Button size="sm" onPress={openCreate}>
                <Plus className="size-4" />
                নতুন ভাষা
              </Button>
            </>
          ) : null
        }
      />

      <Alert status="accent">
        <Alert.Indicator>
          <Globe />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>ডিফল্ট ভাষা ইংরেজি</Alert.Title>
          <Alert.Description>
            নতুন ভিজিটর ইংরেজি দেখবে। বাংলা বা অন্য ভাষা নির্বাচন করলে পছন্দ ব্রাউজারে সংরক্ষিত হবে; অনুবাদ না থাকলে ইংরেজি ফলব্যাক দেখাবে।
          </Alert.Description>
        </Alert.Content>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {languages.map((language) => (
          <Card key={language.code}>
            <Card.Header className="flex-row items-start justify-between gap-2">
              <div>
                <Card.Title className="flex items-center gap-2 text-base">
                  <LanguagesIcon className="text-accent size-4" aria-hidden="true" />
                  {language.nativeName}
                  {language.isDefault ? (
                    <Chip size="sm" color="accent" variant="soft">
                      <Chip.Label>ডিফল্ট</Chip.Label>
                    </Chip>
                  ) : null}
                </Card.Title>
                <Card.Description>
                  {language.name} · <span className="font-mono">{language.code}</span> ·{" "}
                  {language.direction.toUpperCase()}
                </Card.Description>
              </div>
              <Chip
                size="sm"
                color={language.status === "active" ? "success" : "default"}
                variant="soft"
              >
                <Chip.Label>{language.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}</Chip.Label>
              </Chip>
            </Card.Header>
            <Card.Content className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span>ক্রম: {language.sortOrder}</span>
              {language.protected ? (
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="size-3.5" /> সুরক্ষিত
                </span>
              ) : null}
            </Card.Content>
            <Card.Footer className="flex flex-wrap justify-end gap-2">
              {canEdit && !language.isDefault ? (
                <Button
                  size="sm"
                  variant="ghost"
                  isPending={defaulting === language.code}
                  isDisabled={language.status !== "active"}
                  onPress={() => void makeDefault(language)}
                >
                  <Star className="size-4" />
                  ডিফল্ট করুন
                </Button>
              ) : null}
              {canEdit ? (
                <Button
                  size="sm"
                  variant="ghost"
                  isDisabled={language.isDefault || language.code === "en"}
                  onPress={() => void toggleStatus(language)}
                >
                  {language.status === "active" ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                </Button>
              ) : null}
              {canEdit ? (
                <Button size="sm" variant="secondary" onPress={() => openEdit(language)}>
                  <Pencil className="size-4" />
                  সম্পাদনা
                </Button>
              ) : null}
              {canEdit && !language.protected ? (
                <Button
                  size="sm"
                  variant="danger-soft"
                  aria-label={`${language.nativeName} মুছুন`}
                  onPress={() => setDeleteTarget(language)}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </Card.Footer>
          </Card>
        ))}
      </div>

      <Card>
        <Card.Header>
          <Card.Title className="text-base">ইন্টারফেস অনুবাদ</Card.Title>
          <Card.Description>
            অ্যাপের সব দৃশ্যমান লেখা (মোট {UI_CATALOG.length}টি সোর্স স্ট্রিং) ভাষা অনুযায়ী সম্পাদনা করুন। খালি রাখলে ডিফল্ট ফলব্যাক ব্যবহার হবে।
          </Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs font-medium">
                অনুবাদের ভাষা
                <select
                  value={translationLanguage}
                  onChange={(event) => {
                    setTranslationLanguage(event.target.value);
                    setTranslationPage(1);
                  }}
                  className="border-border bg-surface h-9 rounded-xl border px-2 text-sm"
                >
                  {languages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.nativeName} ({language.code})
                    </option>
                  ))}
                </select>
              </label>
              <Button
                size="sm"
                isPending={savingTranslations}
                isDisabled={!canEdit || changedTranslationCount === 0}
                onPress={() => void saveUiTranslations()}
              >
                <Save className="size-4" />
                অনুবাদ সংরক্ষণ ({changedTranslationCount})
              </Button>
            </div>
            <SearchInput
              value={translationQuery}
              onChange={(value) => {
                setTranslationQuery(value);
                setTranslationPage(1);
              }}
              placeholder="বাংলা বা ইংরেজি লেখা খুঁজুন..."
              className="lg:max-w-sm"
            />
          </div>

          {translationRows.length === 0 ? (
            <EmptyState
              plain
              icon={LanguagesIcon}
              title="কোনো স্ট্রিং পাওয়া যায়নি"
              description="অন্য শব্দ দিয়ে সার্চ করুন।"
            />
          ) : (
            <div className="divide-border divide-y rounded-xl border">
              {translationPageRows.map((entry) => {
                const value = translationValue(entry.key, entry.bn, entry.en);
                return (
                  <div key={entry.key} className="grid gap-2 p-3 lg:grid-cols-[1fr_1.1fr] lg:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" title={entry.bn}>
                        {entry.bn}
                      </p>
                      <p className="text-muted truncate text-xs" title={entry.en}>
                        {entry.en} · <span className="font-mono">{entry.key}</span>
                      </p>
                    </div>
                    <TextField
                      name={`ui-translation-${entry.key}`}
                      value={value}
                      isDisabled={!canEdit}
                      onChange={(next) => setTranslation(entry.key, next)}
                      aria-label={`${entry.key} অনুবাদ`}
                    >
                      <Input placeholder={entry.en} />
                    </TextField>
                  </div>
                );
              })}
            </div>
          )}

          <PaginationBar
            page={safeTranslationPage}
            pageCount={translationPageCount}
            onChange={setTranslationPage}
            totalItems={translationRows.length}
          />
        </Card.Content>
      </Card>

      <p className="text-muted text-xs">
        মোট ভাষা: {languages.length} · সক্রিয়: {activeLanguages.length} · ডিফল্ট: {languages.find((language) => language.isDefault)?.nativeName ?? "English"}
      </p>

      <Modal isOpen={editorOpen} onOpenChange={setEditorOpen}>
        <Modal.Backdrop>
          <Modal.Container size="lg">
            <Modal.Dialog className="max-h-[92dvh]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>{editing ? "ভাষা সম্পাদনা" : "নতুন ভাষা"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4 overflow-y-auto">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    name="language-code"
                    isRequired
                    isDisabled={Boolean(editing)}
                    value={form.code}
                    onChange={(code) => setForm((previous) => ({ ...previous, code }))}
                  >
                    <Label>ভাষা কোড</Label>
                    <Input placeholder="en, bn, ar, pt-BR" className="font-mono" />
                    <Description>lowercase BCP-47 কোড; পরে বদলানো যাবে না।</Description>
                  </TextField>
                  <TextField
                    name="language-name"
                    isRequired
                    value={form.name}
                    onChange={(name) => setForm((previous) => ({ ...previous, name }))}
                  >
                    <Label>ভাষার নাম</Label>
                    <Input placeholder="Bengali" />
                  </TextField>
                  <TextField
                    name="language-native-name"
                    isRequired
                    value={form.nativeName}
                    onChange={(nativeName) => setForm((previous) => ({ ...previous, nativeName }))}
                  >
                    <Label>স্থানীয় নাম</Label>
                    <Input placeholder="বাংলা" />
                  </TextField>
                  <TextField
                    name="language-order"
                    isRequired
                    value={String(form.sortOrder)}
                    onChange={(value) =>
                      setForm((previous) => ({ ...previous, sortOrder: Number(value) || 0 }))
                    }
                  >
                    <Label>ক্রম</Label>
                    <Input type="number" min={0} max={9999} />
                  </TextField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm font-medium">
                    টেক্সট দিক
                    <select
                      value={form.direction}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          direction: event.target.value === "rtl" ? "rtl" : "ltr",
                        }))
                      }
                      className="border-border bg-surface h-9 rounded-xl border px-2"
                    >
                      <option value="ltr">LTR</option>
                      <option value="rtl">RTL</option>
                    </select>
                  </label>
                  <Switch
                    name="language-active"
                    isSelected={form.status === "active"}
                    isDisabled={editing?.isDefault === true || editing?.code === "en"}
                    onChange={(isSelected) =>
                      setForm((previous) => ({
                        ...previous,
                        status: isSelected ? "active" : "inactive",
                      }))
                    }
                  >
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Switch.Content>
                      <Label>সক্রিয়</Label>
                      <Description>ডিফল্ট ভাষা নিষ্ক্রিয় করা যাবে না।</Description>
                    </Switch.Content>
                  </Switch>
                </div>

                {editing && BASE_LANGUAGE_CODES.has(editing.code) ? (
                  <Alert status="accent">
                    <Alert.Indicator>
                      <ShieldCheck />
                    </Alert.Indicator>
                    <Alert.Content>
                      <Alert.Description>
                        এটি সিস্টেম ভাষা। কোড ও সুরক্ষা পরিবর্তন করা যাবে না; English সর্বদা সক্রিয় থাকবে।
                      </Alert.Description>
                    </Alert.Content>
                  </Alert>
                ) : null}

                {formError ? <FieldError>{formError}</FieldError> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" isDisabled={saving} onPress={() => setEditorOpen(false)}>
                  বাতিল
                </Button>
                <Button isPending={saving} onPress={() => void save()}>
                  <Check className="size-4" />
                  {editing ? "সংরক্ষণ" : "ভাষা যোগ করুন"}
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
        title="ভাষা মুছে ফেলবেন?"
        message={
          deleteTarget
            ? `"${deleteTarget.nativeName}" (${deleteTarget.code}) এবং এই ভাষার সংরক্ষিত অনুবাদ মুছে যাবে। ডিফল্ট বা সিস্টেম ভাষা মুছে ফেলা যাবে না।`
            : ""
        }
        confirmLabel="মুছে ফেলুন"
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
