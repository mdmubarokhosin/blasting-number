import {
  BarChart3,
  ClipboardList,
  History,
  Languages,
  LayoutDashboard,
  ListPlus,
  Moon,
  Settings,
  Tags,
  ShieldCheck,
  UserRound,
  Users,
  type IconComponent,
} from "../icons";

export interface NavItem {
  to: string;
  label: string;
  icon: IconComponent;
  end?: boolean;
  /** Permission required to display the item. */
  permission?: string;
}

export const userNavItems: NavItem[] = [
  { to: "/lists", label: "আমার তালিকা", icon: ClipboardList, end: true },
  {
    to: "/lists/new",
    label: "নতুন তালিকা",
    icon: ListPlus,
    permission: "lists.create",
  },
  { to: "/profile", label: "প্রোফাইল", icon: UserRound },
];

export const adminNavItems: NavItem[] = [
  {
    to: "/admin",
    label: "ড্যাশবোর্ড",
    icon: LayoutDashboard,
    end: true,
    permission: "dashboard.view",
  },
  { to: "/admin/users", label: "ইউজার", icon: Users, permission: "users.view" },
  {
    to: "/admin/roles",
    label: "রোল ও অনুমতি",
    icon: ShieldCheck,
    permission: "roles.view",
  },
  {
    to: "/admin/categories",
    label: "ক্যাটাগরি",
    icon: Tags,
    permission: "categories.view",
  },
  { to: "/admin/shifts", label: "শিফট", icon: Moon, permission: "shifts.view" },
  {
    to: "/admin/lists",
    label: "তালিকা",
    icon: ClipboardList,
    permission: "lists.manage",
  },
  {
    to: "/admin/analytics",
    label: "বিশ্লেষণ",
    icon: BarChart3,
    permission: "dashboard.view",
  },
  {
    to: "/admin/logs",
    label: "অ্যাক্টিভিটি",
    icon: History,
    permission: "audit.view",
  },
  {
    to: "/admin/languages",
    label: "ভাষা ও অনুবাদ",
    icon: Languages,
    permission: "settings.view",
  },
  {
    to: "/admin/settings",
    label: "সেটিংস",
    icon: Settings,
    permission: "settings.view",
  },
];
