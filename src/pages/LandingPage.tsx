import { Card, Chip } from "@heroui/react";
import {
  BarChart3,
  CheckCircle2,
  FileDown,
  History,
  KeyRound,
  Layers,
  ListPlus,
  Lock,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Users,
  Wifi,
} from "../components/icons";
import { type ReactNode, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthDialog, type AuthMode } from "../components/auth/AuthDialog";
import { LandingFooter } from "../components/layout/LandingFooter";
import { LandingHeader } from "../components/layout/LandingHeader";
import { CategoryBadge } from "../components/common/Badges";
import { CodeText } from "../components/common/CodeText";
import { SectionHeader } from "../components/common/SectionHeader";
import { useAuth } from "../features/auth/AuthProvider";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useSite } from "../i18n/SiteProvider";
import { legacyCategory } from "../utils/categories";

const FEATURES = [
  { icon: Layers, titleKey: "feature.category.title", textKey: "feature.category.text" },
  { icon: ShieldCheck, titleKey: "feature.duplicate.title", textKey: "feature.duplicate.text" },
  { icon: FileDown, titleKey: "feature.reports.title", textKey: "feature.reports.text" },
  { icon: ScanLine, titleKey: "feature.ocr.title", textKey: "feature.ocr.text" },
  { icon: Wifi, titleKey: "feature.realtime.title", textKey: "feature.realtime.text" },
  { icon: History, titleKey: "feature.audit.title", textKey: "feature.audit.text" },
] as const;

const SECURITY_POINTS = [
  { icon: KeyRound, titleKey: "security.authentication.title", textKey: "security.authentication.text" },
  { icon: Lock, titleKey: "security.rules.title", textKey: "security.rules.text" },
  { icon: Users, titleKey: "security.rbac.title", textKey: "security.rbac.text" },
  { icon: BarChart3, titleKey: "security.data.title", textKey: "security.data.text" },
] as const;

const FAQS = [
  { questionKey: "faq.account.q", answerKey: "faq.account.a" },
  { questionKey: "faq.others.q", answerKey: "faq.others.a" },
  { questionKey: "faq.inactive.q", answerKey: "faq.inactive.a" },
  { questionKey: "faq.admin.q", answerKey: "faq.admin.a" },
] as const;

function HeroPreview(): ReactNode {
  const { content } = useSite();
  const example = [
    {
      category: "Blasting" as const,
      code: "A1-L12-BM-1011 1/2",
      highlight: true,
    },
    { category: "Blasting" as const, code: "A1-L12-BM-1012", highlight: false },
    { category: "Import" as const, code: "IM-2043-07", highlight: false },
    { category: "Damaged" as const, code: "DM-9931", highlight: false },
    { category: "Return" as const, code: "RT-5520 10Pcs", highlight: false },
  ];
  return (
    <Card className="w-full shadow-xl">
      <Card.Header className="flex-row items-center justify-between gap-2">
        <div>
          <Card.Title className="text-base">{content("preview.title")}</Card.Title>
          <Card.Description>{content("preview.description")}</Card.Description>
        </div>
        <Chip size="sm" variant="soft" color="accent">
          <Chip.Label>{content("preview.badge")}</Chip.Label>
        </Chip>
      </Card.Header>
      <Card.Content className="flex flex-col gap-2">
        {example.map((row) => (
          <div
            key={row.code}
            className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
              row.highlight ? "border-danger/40 bg-danger/5" : ""
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <CategoryBadge category={legacyCategory(row.category)} />
              <CodeText code={row.code} className="text-sm" />
            </div>
            {row.highlight ? (
              <Chip size="sm" variant="soft" color="danger">
                <Chip.Label>{content("preview.duplicate")}</Chip.Label>
              </Chip>
            ) : (
              <CheckCircle2
                className="text-success size-4 shrink-0"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </Card.Content>
      <Card.Footer className="text-muted text-xs">{content("preview.footer")}</Card.Footer>
    </Card>
  );
}

export function LandingPage(): ReactNode {
  const { status, profile } = useAuth();
  const { content, settings } = useSite();
  const [searchParams, setSearchParams] = useSearchParams();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  const authParam = searchParams.get("auth");
  const nextParam = searchParams.get("next") ?? undefined;
  const authenticated = status === "authenticated" && Boolean(profile);

  useDocumentTitle(content("site.subtitle"), settings.brandName);

  useEffect(() => {
    if (authParam === "login" || authParam === "register") {
      setAuthMode(authParam);
      setAuthOpen(true);
    }
  }, [authParam]);

  const openAuth = (mode: AuthMode) => {
    if (authenticated) return;
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setAuthOpen(open);
    if (!open && searchParams.has("auth")) {
      const params = new URLSearchParams(searchParams);
      params.delete("auth");
      params.delete("next");
      setSearchParams(params, { replace: true });
    }
  };

  return (
    <div className="bg-background min-h-dvh">
      <LandingHeader
        onLogin={() => openAuth("login")}
        onRegister={() => openAuth("register")}
      />

      <main>
        <section className="relative overflow-hidden">
          <div
            className="from-accent/15 via-background pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent"
            aria-hidden="true"
          />
          <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-4 py-14 text-center sm:px-6 lg:py-20">
            <div className="flex w-full flex-col items-center">
              <Chip size="sm" variant="soft" color="accent">
                <Chip.Label>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="size-3.5" /> {content("hero.badge")}
                  </span>
                </Chip.Label>
              </Chip>
              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                {content("hero.title")}{" "}
                <span className="text-accent">{content("hero.titleAccent")}</span>
              </h1>
              <p className="text-muted mt-4 max-w-2xl text-base sm:text-lg">
                {content("hero.subtitle")}
              </p>
              <div className="mt-6 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
                <button
                  type="button"
                  className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold shadow-sm transition-colors"
                  onClick={() => openAuth("register")}
                >
                  {content("hero.primaryCta")}
                </button>
                <button
                  type="button"
                  className="border-border hover:bg-default inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3 font-semibold transition-colors"
                  onClick={() => openAuth("login")}
                >
                  {content("hero.secondaryCta")}
                </button>
                <Link
                  to="/lists/new"
                  className="border-border hover:bg-default inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3 font-semibold transition-colors"
                >
                  <ListPlus className="size-4" aria-hidden="true" />
                  {content("hero.tertiaryCta")}
                </Link>
              </div>
              <p className="text-muted mt-4 text-xs">{content("hero.note")}</p>
            </div>
            <div className="mx-auto w-full max-w-xl">
              <HeroPreview />
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6"
        >
          <SectionHeader title={content("features.title")} description={content("features.description")} />
          <div className="bn-card-grid mt-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.titleKey} className="bn-card bn-card-center bn-feature-card">
                <Card.Content className="items-center p-5">
                  <span className="bn-icon-tile" aria-hidden="true">
                    <feature.icon className="size-5" />
                  </span>
                  <p className="mt-1 font-semibold">{content(feature.titleKey)}</p>
                  <p className="text-muted mt-1 text-sm">{content(feature.textKey)}</p>
                </Card.Content>
              </Card>
            ))}
          </div>
        </section>

        <section id="security" className="bg-surface scroll-mt-20 border-y py-14">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionHeader title={content("security.title")} description={content("security.description")} />
            <div className="bn-card-grid mt-10 sm:grid-cols-2">
              {SECURITY_POINTS.map((point) => (
                <Card key={point.titleKey} className="bn-card bn-card-center">
                  <Card.Content className="items-center gap-3 p-5">
                    <span className="bn-icon-tile bn-icon-tile--success" aria-hidden="true">
                      <point.icon className="size-5" />
                    </span>
                    <p className="font-semibold">{content(point.titleKey)}</p>
                    <p className="text-muted mt-1 text-sm">{content(point.textKey)}</p>
                  </Card.Content>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="mx-auto w-full max-w-3xl scroll-mt-20 px-4 py-14 sm:px-6"
        >
          <SectionHeader title={content("faq.title")} description={content("faq.description")} />
          <div className="mt-8 space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.questionKey} className="bg-surface group rounded-xl border p-4">
                <summary className="cursor-pointer list-none font-medium">
                  <span className="flex items-center justify-between gap-3">
                    {content(faq.questionKey)}
                    <span className="text-muted transition-transform group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </span>
                </summary>
                <p className="text-muted mt-3 text-sm">{content(faq.answerKey)}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <LandingFooter />

      <AuthDialog
        isOpen={authOpen}
        onOpenChange={handleOpenChange}
        initialMode={authMode}
        nextPath={nextParam}
      />
    </div>
  );
}
