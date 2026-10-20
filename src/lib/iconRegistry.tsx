import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeCheck,
  BarChart3,
  Box,
  Boxes,
  Brush,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Clock,
  Compass,
  Container,
  Database,
  Eye,
  Factory,
  FileText,
  Flag,
  Flame,
  Gauge,
  Globe,
  Hammer,
  HardHat,
  KeyRound,
  Layers,
  ListChecks,
  Lock,
  Moon,
  Package,
  Palette,
  Pencil,
  Repeat2,
  RotateCcw,
  ScanLine,
  ScrollText,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Siren,
  Sparkles,
  Star,
  Sun,
  Tag,
  Trash2,
  TriangleAlert,
  Truck,
  UserCog,
  UserRound,
  Users,
  Warehouse,
  Wrench,
  Zap,
  type IconComponent,
} from "../components/icons";
import type { ReactNode } from "react";

export interface IconOption {
  key: string;
  label: string;
  keywords: string;
  Icon: IconComponent;
}

/** Curated, local icon registry. Database stores only these safe identifiers. */
export const ICON_OPTIONS: IconOption[] = [
  { key: "flame", label: "Flame", keywords: "blast fire flame", Icon: Flame },
  {
    key: "arrow-down-to-line",
    label: "Import",
    keywords: "import download inbound",
    Icon: ArrowDownToLine,
  },
  {
    key: "arrow-up-from-line",
    label: "Export",
    keywords: "export upload outbound",
    Icon: ArrowUpFromLine,
  },
  {
    key: "triangle-alert",
    label: "Warning",
    keywords: "warning alert damaged",
    Icon: TriangleAlert,
  },
  {
    key: "rotate-ccw",
    label: "Return",
    keywords: "return rollback",
    Icon: RotateCcw,
  },
  {
    key: "repeat2",
    label: "Repeat",
    keywords: "repeat exchange",
    Icon: Repeat2,
  },
  { key: "package", label: "Package", keywords: "package box", Icon: Package },
  { key: "boxes", label: "Boxes", keywords: "boxes inventory", Icon: Boxes },
  { key: "box", label: "Box", keywords: "box carton", Icon: Box },
  {
    key: "container",
    label: "Container",
    keywords: "container shipping",
    Icon: Container,
  },
  { key: "truck", label: "Truck", keywords: "truck transport", Icon: Truck },
  {
    key: "warehouse",
    label: "Warehouse",
    keywords: "warehouse storage",
    Icon: Warehouse,
  },
  {
    key: "factory",
    label: "Factory",
    keywords: "factory plant",
    Icon: Factory,
  },
  {
    key: "hard-hat",
    label: "Hard Hat",
    keywords: "worker safety",
    Icon: HardHat,
  },
  { key: "wrench", label: "Wrench", keywords: "repair tool", Icon: Wrench },
  { key: "hammer", label: "Hammer", keywords: "build tool", Icon: Hammer },
  {
    key: "clipboard-list",
    label: "Clipboard",
    keywords: "list clipboard",
    Icon: ClipboardList,
  },
  {
    key: "list-checks",
    label: "Checklist",
    keywords: "checklist tasks",
    Icon: ListChecks,
  },
  {
    key: "file-text",
    label: "Document",
    keywords: "document file",
    Icon: FileText,
  },
  {
    key: "scroll-text",
    label: "Log",
    keywords: "log audit scroll",
    Icon: ScrollText,
  },
  {
    key: "shield-check",
    label: "Shield Check",
    keywords: "shield security master",
    Icon: ShieldCheck,
  },
  { key: "shield", label: "Shield", keywords: "shield security", Icon: Shield },
  { key: "lock", label: "Lock", keywords: "lock security", Icon: Lock },
  { key: "key-round", label: "Key", keywords: "key access", Icon: KeyRound },
  { key: "users", label: "Users", keywords: "users people", Icon: Users },
  {
    key: "user-cog",
    label: "User Settings",
    keywords: "user role admin",
    Icon: UserCog,
  },
  {
    key: "user-round",
    label: "User",
    keywords: "user person",
    Icon: UserRound,
  },
  {
    key: "badge-check",
    label: "Verified",
    keywords: "badge verified quality",
    Icon: BadgeCheck,
  },
  {
    key: "bar-chart",
    label: "Chart",
    keywords: "chart analytics stats",
    Icon: BarChart3,
  },
  { key: "gauge", label: "Gauge", keywords: "gauge performance", Icon: Gauge },
  {
    key: "settings",
    label: "Settings",
    keywords: "settings gear",
    Icon: Settings,
  },
  {
    key: "database",
    label: "Database",
    keywords: "database data",
    Icon: Database,
  },
  { key: "layers", label: "Layers", keywords: "layers stack", Icon: Layers },
  { key: "tag", label: "Tag", keywords: "tag label", Icon: Tag },
  {
    key: "palette",
    label: "Palette",
    keywords: "palette color",
    Icon: Palette,
  },
  { key: "brush", label: "Brush", keywords: "brush appearance", Icon: Brush },
  { key: "scan-line", label: "Scan", keywords: "scan ocr", Icon: ScanLine },
  { key: "search", label: "Search", keywords: "search find", Icon: Search },
  {
    key: "calendar",
    label: "Calendar",
    keywords: "calendar date",
    Icon: CalendarDays,
  },
  {
    key: "compass",
    label: "Compass",
    keywords: "compass direction",
    Icon: Compass,
  },
  { key: "globe", label: "Globe", keywords: "globe world", Icon: Globe },
  { key: "flag", label: "Flag", keywords: "flag marker", Icon: Flag },
  { key: "star", label: "Star", keywords: "star favorite", Icon: Star },
  {
    key: "sparkles",
    label: "Sparkles",
    keywords: "sparkles new",
    Icon: Sparkles,
  },
  { key: "zap", label: "Zap", keywords: "zap energy", Icon: Zap },
  { key: "sun", label: "Sun", keywords: "sun day light shift", Icon: Sun },
  { key: "moon", label: "Moon", keywords: "moon night dark shift", Icon: Moon },
  {
    key: "clock",
    label: "Clock",
    keywords: "clock time shift schedule",
    Icon: Clock,
  },
  {
    key: "circle-check",
    label: "Check",
    keywords: "check success",
    Icon: CircleCheck,
  },
  {
    key: "circle-alert",
    label: "Alert",
    keywords: "alert error",
    Icon: CircleAlert,
  },
  { key: "eye", label: "Eye", keywords: "eye view", Icon: Eye },
  { key: "pencil", label: "Pencil", keywords: "pencil edit", Icon: Pencil },
  { key: "trash", label: "Trash", keywords: "trash delete", Icon: Trash2 },
  { key: "siren", label: "Siren", keywords: "siren urgent", Icon: Siren },
];

const ICON_MAP = new Map(ICON_OPTIONS.map((option) => [option.key, option]));

export const DEFAULT_ICON_KEY = "tag";

export function iconExists(key: string | undefined): boolean {
  return Boolean(key && ICON_MAP.has(key));
}

export function iconLabel(key: string | undefined): string {
  return (key && ICON_MAP.get(key)?.label) || "Tag";
}

export function IconRenderer({
  name,
  className,
  "aria-hidden": ariaHidden = true,
}: {
  name: string | undefined;
  className?: string;
  "aria-hidden"?: boolean;
}): ReactNode {
  const Icon = (name && ICON_MAP.get(name)?.Icon) || Tag;
  return <Icon className={className} aria-hidden={ariaHidden} />;
}
