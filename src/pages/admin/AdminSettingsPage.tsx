import {
  Button,
  Card,
  Description,
  FieldError,
  Input,
  Label,
  Switch,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { Image, RotateCcw, Save } from "../../components/icons";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { useAuth } from "../../features/auth/AuthProvider";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useSite } from "../../i18n/SiteProvider";
import {
  CONTENT_GROUP_LABELS,
  WEBSITE_CONTENT_FIELDS,
} from "../../i18n/content";
import {
  dbErrorMessage,
  firstZodError,
  websiteSettingsSchema,
} from "../../lib/validation";
import { logActivity } from "../../services/activityLogs";
import { saveTranslationValues } from "../../services/languages";
import { isSafeLogoUrl, saveSettings } from "../../services/settings";
import { DEFAULT_SETTINGS, type AppSettings } from "../../types";
import { useFormat } from "../../hooks/useFormat";

const FEATURE_META: {
  key: keyof AppSettings["features"];
  label: string;
  description: string;
}[] = [
  { key: "pdfExport", label: "PDF এক্সপোর্ট", description: "তালিকা PDF ফাইল হিসেবে ডাউনলোড" },
  { key: "csvExport", label: "CSV এক্সপোর্ট", description: "তালিকা CSV ফাইল হিসেবে ডাউনলোড" },
  { key: "ocrScanner", label: "OCR স্ক্যানার", description: "ছবি থেকে কোড স্ক্যান করে যোগ করা" },
  {
    key: "whatsappShare",
    label: "হোয়াটসঅ্যাপ শেয়ার",
    description: "তালিকা সরাসরি হোয়াটসঅ্যাপে শেয়ার করা",
  },
];

type SettingsTab = "general" | "content" | "features";

const CONTENT_GROUPS = [
  "Branding",
  "Header",
  "Hero",
  "Hero preview",
  "Features",
  "Security",
  "FAQ",
  "Footer",
  "Contact",
];

function cloneSettings(source: AppSettings): AppSettings {
  return {
    brandName: source.brandName,
    logoUrl: source.logoUrl,
    contactEmail: source.contactEmail,
    contactPhone: source.contactPhone,
    contactAddress: source.contactAddress,
    features: { ...source.features },
    updatedAt: source.updatedAt,
  };
}

function sameSettings(a: AppSettings, b: AppSettings): boolean {
  return (
    a.brandName === b.brandName &&
    a.logoUrl === b.logoUrl &&
    a.contactEmail === b.contactEmail &&
    a.contactPhone === b.contactPhone &&
    a.contactAddress === b.contactAddress &&
    FEATURE_META.every((meta) => a.features[meta.key] === b.features[meta.key])
  );
}

function LogoPreview({ url }: { url: string }): ReactNode {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  const valid = Boolean(url) && isSafeLogoUrl(url) && !failed;
  return (
    <div className="border-border bg-default/40 flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border">
      {valid ? (
        <img
          src={url}
          alt=""
          className="size-full object-contain"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <Image className="text-muted size-7" aria-hidden="true" />
      )}
    </div>
  );
}

export function AdminSettingsPage(): ReactNode {
  const { can } = useAuth();
  const {
    settings,
    contentFor,
    languages,
    activeLanguages,
    languageCode,
  } = useSite();
  const canEdit = can("settings.edit");
  const fmt = useFormat();
  const [tab, setTab] = useState<SettingsTab>("general");
  const [contentLanguage, setContentLanguage] = useState(languageCode);
  const [draft, setDraft] = useState<AppSettings>(() => cloneSettings(settings));
  const [translationDraft, setTranslationDraft] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  useDocumentTitle("সেটিংস");

  useEffect(() => {
    setDraft(cloneSettings(settings));
  }, [settings]);

  useEffect(() => {
    if (activeLanguages.some((language) => language.code === contentLanguage)) return;
    setContentLanguage(
      activeLanguages.find((language) => language.isDefault)?.code ??
        activeLanguages[0]?.code ??
        "en",
    );
  }, [activeLanguages, contentLanguage]);

  const parsed = websiteSettingsSchema.safeParse({
    brandName: draft.brandName,
    logoUrl: draft.logoUrl,
    contactEmail: draft.contactEmail,
    contactPhone: draft.contactPhone,
    contactAddress: draft.contactAddress,
  });
  const formError = parsed.success ? null : firstZodError(parsed.error);

  const changedTranslations = useMemo(() => {
    const out: Record<string, Record<string, string>> = {};
    for (const [key, languages] of Object.entries(translationDraft)) {
      for (const [code, value] of Object.entries(languages)) {
        if (value.trim() !== contentFor(key, code).trim()) {
          out[key] = out[key] ?? {};
          out[key][code] = value;
        }
      }
    }
    return out;
  }, [contentFor, translationDraft]);

  const contentDirty = Object.keys(changedTranslations).length > 0;
  const dirty = !sameSettings(draft, settings) || contentDirty;

  const reset = () => {
    setDraft(cloneSettings({ ...DEFAULT_SETTINGS, updatedAt: settings.updatedAt }));
    setTranslationDraft({});
  };

  const setField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
  };

  const setTranslation = (key: string, code: string, value: string) => {
    setTranslationDraft((previous) => ({
      ...previous,
      [key]: { ...(previous[key] ?? {}), [code]: value },
    }));
  };

  const translationValue = (key: string, code: string): string => {
    const written = translationDraft[key]?.[code];
    return written === undefined ? contentFor(key, code) : written;
  };

  const handleSave = async () => {
    if (!parsed.success) {
      toast(formError ?? "সেটিংস সঠিক নয়", { variant: "warning" });
      return;
    }
    setSaving(true);
    try {
      await saveSettings({
        ...draft,
        ...parsed.data,
        brandName: parsed.data.brandName,
        features: { ...draft.features },
      });
      if (contentDirty) {
        await saveTranslationValues(changedTranslations);
      }
      const changedFeatures = FEATURE_META.filter(
        (meta) => draft.features[meta.key] !== settings.features[meta.key],
      ).map((meta) => meta.label);
      const parts: string[] = [];
      if (draft.brandName !== settings.brandName) parts.push(`ওয়েবসাইটের নাম "${draft.brandName}"`);
      if (draft.logoUrl !== settings.logoUrl) parts.push("লোগো");
      if (
        draft.contactEmail !== settings.contactEmail ||
        draft.contactPhone !== settings.contactPhone ||
        draft.contactAddress !== settings.contactAddress
      ) {
        parts.push("যোগাযোগের তথ্য");
      }
      if (changedFeatures.length > 0) parts.push(`ফিচার: ${changedFeatures.join(", ")}`);
      if (contentDirty) parts.push("ওয়েবসাইট কনটেন্ট ও অনুবাদ");
      await logActivity(
        contentDirty ? "translation_update" : "settings_change",
        parts.length > 0 ? `${parts.join(", ")} আপডেট করা হয়েছে` : "সেটিংস সংরক্ষণ করা হয়েছে",
        { targetType: "settings", targetId: "app" },
      );
      toast("ওয়েবসাইট সেটিংস সংরক্ষিত হয়েছে", { variant: "success" });
      setTranslationDraft({});
    } catch (error) {
      toast(dbErrorMessage(error), { variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="ওয়েবসাইট সেটিংস"
        description="লোগো, যোগাযোগ, ব্র্যান্ডিং, ওয়েবসাইটের সব লেখা ও ফিচার নিয়ন্ত্রণ করুন।"
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={!canEdit || !dirty || saving}
              onPress={reset}
            >
              <RotateCcw className="size-4" />
              ডিফল্ট
            </Button>
            <Button
              size="sm"
              variant="primary"
              isDisabled={!canEdit || !dirty || Boolean(formError)}
              isPending={saving}
              onPress={() => void handleSave()}
            >
              <Save className="size-4" />
              সংরক্ষণ
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="সেটিংস বিভাগ">
        {(
          [
            ["general", "সাধারণ"],
            ["content", "ওয়েবসাইট কনটেন্ট"],
            ["features", "ফিচার"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={tab === key ? "primary" : "secondary"}
            onPress={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "general" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <Card.Header>
              <Card.Title className="text-base">ব্র্যান্ডিং</Card.Title>
              <Card.Description>ওয়েবসাইটের নাম ও লোগো সব পাবলিক পেজে দেখানো হবে।</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <TextField
                name="brand-name"
                isRequired
                value={draft.brandName}
                isDisabled={!canEdit}
                onChange={(value) => setField("brandName", value)}
                isInvalid={!draft.brandName.trim()}
              >
                <Label>ওয়েবসাইটের নাম</Label>
                <Input placeholder="Blasting Number" />
                {!draft.brandName.trim() ? (
                  <FieldError>ওয়েবসাইটের নাম দিন</FieldError>
                ) : null}
              </TextField>

              <div className="flex items-start gap-3">
                <LogoPreview url={draft.logoUrl} />
                <TextField
                  name="logo-url"
                  className="min-w-0 flex-1"
                  value={draft.logoUrl}
                  isDisabled={!canEdit}
                  onChange={(value) => setField("logoUrl", value)}
                  isInvalid={!isSafeLogoUrl(draft.logoUrl)}
                >
                  <Label>লোগো URL</Label>
                  <Input placeholder="https://example.com/logo.png" inputMode="url" />
                  <Description>https URL অথবা সাইটের /path। খালি রাখলে ডিফল্ট আইকন দেখাবে।</Description>
                  {!isSafeLogoUrl(draft.logoUrl) ? (
                    <FieldError>লোগো URL সঠিক http(s) বা /path হতে হবে</FieldError>
                  ) : null}
                </TextField>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title className="text-base">যোগাযোগ</Card.Title>
              <Card.Description>ফুটারে দেখানো যোগাযোগের তথ্য। খালি ঘর লুকানো থাকবে।</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <TextField
                name="contact-email"
                value={draft.contactEmail}
                isDisabled={!canEdit}
                onChange={(value) => setField("contactEmail", value)}
                isInvalid={
                  Boolean(draft.contactEmail) &&
                  !websiteSettingsSchema.shape.contactEmail.safeParse(draft.contactEmail).success
                }
              >
                <Label>যোগাযোগ ইমেইল</Label>
                <Input type="email" placeholder="info@example.com" />
              </TextField>
              <TextField
                name="contact-phone"
                value={draft.contactPhone}
                isDisabled={!canEdit}
                onChange={(value) => setField("contactPhone", value)}
                isInvalid={
                  Boolean(draft.contactPhone) &&
                  !websiteSettingsSchema.shape.contactPhone.safeParse(draft.contactPhone).success
                }
              >
                <Label>যোগাযোগ ফোন</Label>
                <Input type="tel" placeholder="+880 1700 000000" />
              </TextField>
              <TextField
                name="contact-address"
                value={draft.contactAddress}
                isDisabled={!canEdit}
                onChange={(value) => setField("contactAddress", value)}
              >
                <Label>যোগাযোগ ঠিকানা</Label>
                <Input placeholder="ঢাকা, বাংলাদেশ" />
              </TextField>
            </Card.Content>
          </Card>
        </div>
      ) : null}

      {tab === "content" ? (
        <Card>
          <Card.Header>
            <Card.Title className="text-base">ওয়েবসাইট কনটেন্ট</Card.Title>
            <Card.Description>
              পাবলিক সাইটের সব লেখা ভাষা অনুযায়ী সম্পাদনা করুন। খালি রাখলে ইংরেজি/ডিফল্ট লেখা ব্যবহার হবে।
            </Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">ভাষা:</span>
              {languages.map((language) => (
                <Button
                  key={language.code}
                  size="sm"
                  variant={contentLanguage === language.code ? "primary" : "secondary"}
                  isDisabled={language.status !== "active"}
                  onPress={() => setContentLanguage(language.code)}
                >
                  {language.nativeName}
                  {language.isDefault
                    ? languageCode === "bn"
                      ? " · ডিফল্ট"
                      : " · Default"
                    : ""}
                </Button>
              ))}
            </div>
            {CONTENT_GROUPS.map((group) => {
              const fields = WEBSITE_CONTENT_FIELDS.filter((field) => field.group === group);
              if (fields.length === 0) return null;
              return (
                <details key={group} open={group === "Branding" || group === "Hero"} className="rounded-xl border">
                  <summary className="cursor-pointer px-4 py-3 font-semibold">
                    {languageCode === "bn"
                      ? (CONTENT_GROUP_LABELS[group]?.bn ?? group)
                      : (CONTENT_GROUP_LABELS[group]?.en ?? group)}{" "}
                    <span className="text-muted text-xs">({fields.length})</span>
                  </summary>
                  <div className="grid gap-4 border-t p-4 lg:grid-cols-2">
                    {fields.map((field) => {
                      const value = translationValue(field.key, contentLanguage);
                      const fallback = contentFor(field.key, contentLanguage);
                      return (
                        <TextField
                          key={field.key}
                          name={`content-${field.key}`}
                          className={field.multiline ? "lg:col-span-2" : ""}
                          value={value}
                          isDisabled={!canEdit}
                          onChange={(next) => setTranslation(field.key, contentLanguage, next)}
                        >
                          <Label>
                            {languageCode === "bn"
                              ? (field.labelBn ?? field.label)
                              : field.label}
                          </Label>
                          {field.multiline ? (
                            <TextArea rows={3} placeholder={fallback} />
                          ) : (
                            <Input placeholder={fallback} />
                          )}
                          <Description className="font-mono text-[10px]">{field.key}</Description>
                        </TextField>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </Card.Content>
        </Card>
      ) : null}

      {tab === "features" ? (
        <Card>
          <Card.Header>
            <Card.Title className="text-base">ফিচার</Card.Title>
            <Card.Description>বন্ধ করা ফিচার ব্যবহারকারীদের জন্য লুকানো থাকবে।</Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            {FEATURE_META.map((meta) => (
              <Switch
                key={meta.key}
                name={`feature-${meta.key}`}
                isSelected={draft.features[meta.key]}
                isDisabled={!canEdit}
                onChange={(isSelected) =>
                  setDraft((previous) => ({
                    ...previous,
                    features: { ...previous.features, [meta.key]: isSelected },
                  }))
                }
              >
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Switch.Content>
                  <Label>{meta.label}</Label>
                  <Description>{meta.description}</Description>
                </Switch.Content>
              </Switch>
            ))}
          </Card.Content>
        </Card>
      ) : null}

      <p className="text-muted text-xs">
        সর্বশেষ সংরক্ষণ: {fmt.timestamp(settings.updatedAt)}
        {dirty ? " · অসংরক্ষিত পরিবর্তন আছে" : ""}
      </p>
    </div>
  );
}
