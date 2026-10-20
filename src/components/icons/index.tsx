import type { ComponentType, HTMLAttributes, ReactElement } from "react";

export interface IconProps extends HTMLAttributes<HTMLElement> {
  /** Icon size in CSS units. Prefer Tailwind size-* classes when possible. */
  size?: number | string;
}

/**
 * Central Bootstrap Icons renderer. The icon font is loaded once from the
 * official Bootstrap Icons CDN in index.html. Database records store stable
 * semantic icon names; iconRegistry maps those names to Bootstrap classes.
 */
export function BootstrapIcon({
  name,
  className,
  size,
  style,
  ...props
}: IconProps & { name: string }): ReactElement {
  const labelled = Boolean(props["aria-label"]);
  return (
    <i
      className={`bi bi-${name}${className ? ` ${className}` : ""}`}
      style={size ? { fontSize: size, ...style } : style}
      aria-hidden={labelled ? undefined : true}
      {...props}
    />
  );
}

export type IconComponent = ComponentType<IconProps>;

export const ArrowDownToLine: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="download" {...props} />
);

export const ArrowLeft: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="arrow-left" {...props} />
);

export const ArrowRightLeft: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="arrow-left-right" {...props} />
);

export const ArrowUpFromLine: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="upload" {...props} />
);

export const BadgeCheck: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="patch-check" {...props} />
);

export const BarChart3: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="bar-chart" {...props} />
);

export const Box: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="box" {...props} />
);

export const Boxes: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="boxes" {...props} />
);

export const Brush: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="brush" {...props} />
);

export const CalendarDays: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="calendar3" {...props} />
);

export const Camera: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="camera" {...props} />
);

export const Check: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="check-lg" {...props} />
);

export const CheckCircle2: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="check-circle" {...props} />
);

export const ChevronLeft: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="chevron-left" {...props} />
);

export const ChevronRight: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="chevron-right" {...props} />
);

export const CircleAlert: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="exclamation-circle" {...props} />
);

export const CircleCheck: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="check-circle" {...props} />
);

export const ClipboardList: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="clipboard-data" {...props} />
);

export const Clock: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="clock" {...props} />
);

export const Compass: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="compass" {...props} />
);

export const Container: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="box-seam" {...props} />
);

export const Copy: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="copy" {...props} />
);

export const Database: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="database" {...props} />
);

export const Download: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="download" {...props} />
);

export const Eraser: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="eraser" {...props} />
);

export const Eye: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="eye" {...props} />
);

export const EyeOff: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="eye-slash" {...props} />
);

export const Factory: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="buildings" {...props} />
);

export const FileDown: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="file-earmark-arrow-down" {...props} />
);

export const FileSpreadsheet: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="file-earmark-spreadsheet" {...props} />
);

export const FileText: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="file-earmark-text" {...props} />
);

export const Flag: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="flag" {...props} />
);

export const Flame: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="fire" {...props} />
);

export const Gauge: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="speedometer2" {...props} />
);

export const Globe: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="globe" {...props} />
);

export const Hammer: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="hammer" {...props} />
);

export const HardHat: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="cone-striped" {...props} />
);

export const History: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="clock-history" {...props} />
);

export const Inbox: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="inbox" {...props} />
);

export const KeyRound: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="key" {...props} />
);

export const Layers: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="layers" {...props} />
);

export const LayoutDashboard: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="grid-1x2" {...props} />
);

export const ListChecks: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="list-check" {...props} />
);

export const ListPlus: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="plus-square" {...props} />
);

export const Lock: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="lock" {...props} />
);

export const LogIn: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="box-arrow-in-right" {...props} />
);

export const LogOut: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="box-arrow-right" {...props} />
);

export const MailWarning: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="envelope-exclamation" {...props} />
);

export const Menu: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="list" {...props} />
);

export const MessageCircle: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="chat-dots" {...props} />
);

export const Moon: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="moon-stars" {...props} />
);

export const Package: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="box-seam" {...props} />
);

export const Palette: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="palette" {...props} />
);

export const Pencil: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="pencil-square" {...props} />
);

export const Plus: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="plus-lg" {...props} />
);

export const RefreshCw: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="arrow-clockwise" {...props} />
);

export const Repeat2: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="repeat" {...props} />
);

export const RotateCcw: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="arrow-counterclockwise" {...props} />
);

export const Save: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="floppy" {...props} />
);

export const ScanLine: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="upc-scan" {...props} />
);

export const ScrollText: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="journal-text" {...props} />
);

export const Search: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="search" {...props} />
);

export const Settings: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="gear" {...props} />
);

export const Shield: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="shield" {...props} />
);

export const ShieldAlert: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="shield-exclamation" {...props} />
);

export const ShieldCheck: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="shield-check" {...props} />
);

export const ShieldOff: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="shield-slash" {...props} />
);

export const ShieldX: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="shield-x" {...props} />
);

export const Siren: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="megaphone" {...props} />
);

export const Sparkles: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="stars" {...props} />
);

export const Star: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="star" {...props} />
);

export const Sun: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="sun" {...props} />
);

export const Tag: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="tag" {...props} />
);

export const Tags: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="tags" {...props} />
);

export const Trash2: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="trash" {...props} />
);

export const TriangleAlert: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="exclamation-triangle" {...props} />
);

export const Truck: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="truck" {...props} />
);

export const UserCheck: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="person-check" {...props} />
);

export const UserCog: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="person-gear" {...props} />
);

export const UserPlus: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="person-plus" {...props} />
);

export const UserRound: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="person" {...props} />
);

export const UserX: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="person-x" {...props} />
);

export const Users: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="people" {...props} />
);

export const Warehouse: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="building" {...props} />
);

export const Wifi: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="wifi" {...props} />
);

export const WifiOff: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="wifi-off" {...props} />
);

export const Wrench: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="wrench-adjustable" {...props} />
);

export const Zap: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="lightning-charge" {...props} />
);

export const Mail: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="envelope" {...props} />
);

export const Phone: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="telephone" {...props} />
);

export const MapPin: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="geo-alt" {...props} />
);

export const Languages: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="translate" {...props} />
);

export const Image: IconComponent = (props: IconProps) => (
  <BootstrapIcon name="image" {...props} />
);
