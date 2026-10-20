import { Card } from "@heroui/react";
import { Inbox, type IconComponent } from "../icons";
import { type ReactNode } from "react";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  plain = false,
}: {
  title: string;
  description?: string;
  icon?: IconComponent;
  action?: ReactNode;
  /** Render without an extra Card (for use inside an existing Card). */
  plain?: boolean;
}): ReactNode {
  const content = (
    <>
      <span className="bg-default text-muted inline-flex size-14 items-center justify-center rounded-2xl">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <div>
        <p className="bn-empty-state__title">{title}</p>
        {description ? <p className="bn-empty-state__description mt-1">{description}</p> : null}
      </div>
      {action ? <div className="bn-card-actions">{action}</div> : null}
    </>
  );

  if (plain) {
    return <div className="bn-empty-state">{content}</div>;
  }

  return (
    <Card className="bn-card-center">
      <Card.Content className="bn-empty-state">{content}</Card.Content>
    </Card>
  );
}
