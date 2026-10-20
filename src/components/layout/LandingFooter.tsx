import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useSite } from "../../i18n/SiteProvider";
import { Mail, MapPin, Phone } from "../icons";
import { BrandMark } from "./BrandLink";

export function LandingFooter(): ReactNode {
  const { settings, content } = useSite();
  const hasContact = Boolean(
    settings.contactEmail || settings.contactPhone || settings.contactAddress,
  );

  return (
    <footer className="bg-surface mt-16 border-t">
      <div className="bn-footer-grid mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div>
          <span className="flex items-center gap-2">
            <BrandMark />
            <span className="font-bold">{settings.brandName}</span>
          </span>
          <p className="text-muted mt-3 max-w-xs text-sm">{content("footer.description")}</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{content("footer.linksTitle")}</p>
          <ul className="bn-footer-list text-muted mt-3 text-sm">
            <li>
              <a href="#features" className="hover:text-foreground">
                {content("nav.features")}
              </a>
            </li>
            <li>
              <a href="#security" className="hover:text-foreground">
                {content("nav.security")}
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:text-foreground">
                {content("nav.faq")}
              </a>
            </li>
            <li>
              <Link to="/lists" className="hover:text-foreground">
                {content("nav.dashboard")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">{content("footer.accountTitle")}</p>
          <p className="text-muted mt-3 text-sm">{content("footer.accountText")}</p>
        </div>
      </div>

      {hasContact ? (
        <div className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6">
          <div className="border-border flex flex-col gap-3 border-t pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
            <p className="text-sm font-semibold">{content("contact.title")}</p>
            {settings.contactEmail ? (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="text-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm"
              >
                <Mail className="size-4" aria-hidden="true" />
                {settings.contactEmail}
              </a>
            ) : null}
            {settings.contactPhone ? (
              <a
                href={`tel:${settings.contactPhone.replace(/[^+\d]/g, "")}`}
                className="text-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm"
              >
                <Phone className="size-4" aria-hidden="true" />
                {settings.contactPhone}
              </a>
            ) : null}
            {settings.contactAddress ? (
              <span className="text-muted inline-flex items-center gap-1.5 text-sm">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {settings.contactAddress}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="text-muted border-t px-4 py-4 text-center text-xs sm:px-6">
        {content("footer.copyright", {
          year: new Date().getFullYear(),
          brand: settings.brandName,
        })}
      </div>
    </footer>
  );
}
