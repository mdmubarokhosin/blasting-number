import { Avatar, Button, Drawer, Separator } from "@heroui/react";
import { LogOut, Menu, Shield, WifiOff } from "../icons";
import { type ReactNode, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { BrandLink, BrandMark } from "./BrandLink";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelect } from "../i18n/LanguageSelect";
import { adminNavItems, userNavItems, type NavItem } from "./nav-items";

function navClass(active: boolean): string {
  return [
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    active
      ? "bg-accent text-accent-foreground shadow-sm"
      : "text-muted hover:bg-default hover:text-default-foreground",
  ].join(" ");
}

function NavList({
  items,
  onNavigate,
  extra,
}: {
  items: NavItem[];
  onNavigate?: () => void;
  extra?: ReactNode;
}): ReactNode {
  return (
    <nav className="flex flex-col gap-1" aria-label="প্রধান নেভিগেশন">
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
      {extra}
    </nav>
  );
}

export function UserButton(): ReactNode {
  const { profile, user, logout } = useAuth();
  const name = profile?.displayName || user?.email || "ব্যবহারকারী";
  const initials = (profile?.displayName || user?.email || "U").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <Link to="/profile" className="hidden min-w-0 items-center gap-2 sm:flex" aria-label="প্রোফাইল">
        <Avatar size="sm">
          <Avatar.Fallback>{initials}</Avatar.Fallback>
        </Avatar>
        <span className="max-w-[10rem] truncate text-sm font-medium">{name}</span>
      </Link>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="লগআউট"
        onPress={() => void logout()}
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}

function OfflineBanner(): ReactNode {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="bg-warning/15 text-warning-soft-foreground flex items-center justify-center gap-2 px-4 py-2 text-sm">
      <WifiOff className="size-4" aria-hidden="true" />
      ইন্টারনেট সংযোগ নেই — পরিবর্তনগুলো সংরক্ষিত নাও হতে পারে
    </div>
  );
}

export function AppShell(): ReactNode {
  const { can } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const visibleUserItems = userNavItems.filter(
    (item) => !item.permission || can(item.permission),
  );
  const showAdmin = adminNavItems.some(
    (item) => !item.permission || can(item.permission),
  );

  const adminExtra = showAdmin ? (
    <>
      <Separator className="my-2" />
      <NavLink
        to="/admin"
        className={({ isActive }) => navClass(isActive)}
        onClick={() => setDrawerOpen(false)}
      >
        <Shield className="size-5 shrink-0" aria-hidden="true" />
        <span>অ্যাডমিন প্যানেল</span>
      </NavLink>
    </>
  ) : null;

  return (
    <div className="bg-background min-h-dvh">
      <OfflineBanner />
      <a
        href="#main-content"
        className="focus:bg-accent focus:text-accent-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2"
      >
        মূল কনটেন্টে যান
      </a>

      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside className="bg-surface sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-4 border-r p-4 lg:flex">
          <BrandLink to="/lists" />
          <NavList items={visibleUserItems} extra={adminExtra} />
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
                aria-label="মেনু খুলুন"
                onPress={() => setDrawerOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <BrandLink to="/lists" compact />
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

          <nav
            className="bg-surface/95 fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
            aria-label="মোবাইল নেভিগেশন"
          >
            {visibleUserItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-w-16 flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium ${
                    isActive ? "text-accent" : "text-muted"
                  }`
                }
              >
                <item.icon className="size-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <Drawer isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Backdrop>
          <Drawer.Content placement="left">
            <Drawer.Dialog className="flex h-full flex-col">
              <Drawer.Header>
                <span className="flex items-center gap-2">
                  <BrandMark />
                  <Drawer.Heading>মেনু</Drawer.Heading>
                </span>
              </Drawer.Header>
              <Drawer.Body className="flex-1">
                <NavList
                  items={visibleUserItems}
                  onNavigate={() => setDrawerOpen(false)}
                  extra={adminExtra}
                />
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

export { adminNavItems };
