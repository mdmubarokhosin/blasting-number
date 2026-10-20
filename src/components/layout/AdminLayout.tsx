import { Button, Chip, Drawer, Separator } from "@heroui/react";
import { ArrowLeft, Menu, Shield } from "../icons";
import { type ReactNode, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { BrandLink, BrandMark } from "./BrandLink";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelect } from "../i18n/LanguageSelect";
import { UserButton, adminNavItems } from "./AppShell";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useAuth } from "../../features/auth/AuthProvider";
import { WifiOff } from "../icons";

function navClass(active: boolean): string {
  return [
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    active
      ? "bg-accent text-accent-foreground shadow-sm"
      : "text-muted hover:bg-default hover:text-default-foreground",
  ].join(" ");
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }): ReactNode {
  const { can } = useAuth();
  const items = adminNavItems.filter((item) => !item.permission || can(item.permission));
  return (
    <nav className="flex flex-col gap-1" aria-label="অ্যাডমিন নেভিগেশন">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => navClass(isActive)}
          onClick={onNavigate}
        >
          <item.icon className="size-5 shrink-0" aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
      <Separator className="my-2" />
      <NavLink to="/lists" className={({ isActive }) => navClass(isActive)} onClick={onNavigate}>
        <ArrowLeft className="size-5 shrink-0" aria-hidden="true" />
        <span>অ্যাপে ফিরে যান</span>
      </NavLink>
    </nav>
  );
}

export function AdminLayout(): ReactNode {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const online = useOnlineStatus();

  return (
    <div className="bg-background min-h-dvh">
      {!online ? (
        <div className="bg-warning/15 text-warning-soft-foreground flex items-center justify-center gap-2 px-4 py-2 text-sm">
          <WifiOff className="size-4" aria-hidden="true" />
          ইন্টারনেট সংযোগ নেই
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside className="bg-surface sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-4 border-r p-4 lg:flex">
          <div className="flex flex-col gap-2">
            <BrandLink to="/admin" />
            <Chip size="sm" variant="soft" color="accent" className="w-fit">
              <Chip.Label>
                <span className="inline-flex items-center gap-1">
                  <Shield className="size-3.5" /> অ্যাডমিন প্যানেল
                </span>
              </Chip.Label>
            </Chip>
          </div>
          <AdminNav />
          <div className="mt-auto flex flex-col gap-3">
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <LanguageSelect />
              <ThemeToggle />
            </div>
            <UserButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="bg-surface/80 sticky top-0 z-40 flex items-center justify-between gap-2 border-b px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                variant="ghost"
                aria-label="অ্যাডমিন মেনু খুলুন"
                onPress={() => setDrawerOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <BrandLink to="/admin" compact />
            </div>
            <div className="flex items-center gap-1">
              <LanguageSelect compact />
              <ThemeToggle />
              <UserButton />
            </div>
          </header>

          <main id="main-content" className="bn-app-main flex-1">
            <Outlet />
          </main>
        </div>
      </div>

      <Drawer isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Backdrop>
          <Drawer.Content placement="left">
            <Drawer.Dialog className="flex h-full flex-col">
              <Drawer.Header>
                <span className="flex items-center gap-2">
                  <BrandMark />
                  <Drawer.Heading>অ্যাডমিন প্যানেল</Drawer.Heading>
                </span>
              </Drawer.Header>
              <Drawer.Body className="flex-1">
                <AdminNav onNavigate={() => setDrawerOpen(false)} />
              </Drawer.Body>
              <Drawer.Footer className="flex items-center justify-between">
                <UserButton />
                <ThemeToggle />
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </div>
  );
}
