import { Button } from "@heroui/react";
import { LayoutDashboard } from "../icons";
import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { useSite } from "../../i18n/SiteProvider";
import { BrandLink } from "./BrandLink";
import { LanguageSelect } from "../i18n/LanguageSelect";
import { ThemeToggle } from "./ThemeToggle";

export function LandingHeader({
  onLogin,
  onRegister,
}: {
  onLogin: () => void;
  onRegister: () => void;
}): ReactNode {
  const { status, profile } = useAuth();
  const { content } = useSite();
  const navigate = useNavigate();
  const authenticated = status === "authenticated" && Boolean(profile);

  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <BrandLink to="/" />
          <span className="text-muted hidden max-w-56 truncate text-xs xl:inline">
            {content("header.text")}
          </span>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="ল্যান্ডিং নেভিগেশন">
          <a href="#features" className="text-muted hover:text-foreground transition-colors">
            {content("nav.features")}
          </a>
          <a href="#security" className="text-muted hover:text-foreground transition-colors">
            {content("nav.security")}
          </a>
          <a href="#faq" className="text-muted hover:text-foreground transition-colors">
            {content("nav.faq")}
          </a>
        </nav>
        <div className="flex items-center gap-1.5">
          <LanguageSelect compact />
          <ThemeToggle />
          {authenticated ? (
            <Button size="sm" onPress={() => navigate("/lists")}>
              <LayoutDashboard className="size-4" />
              {content("nav.dashboard")}
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" className="max-sm:hidden" onPress={onLogin}>
                {content("nav.login")}
              </Button>
              <Button size="sm" onPress={onRegister}>
                {content("nav.register")}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
