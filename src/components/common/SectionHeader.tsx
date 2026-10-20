import { type ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}): ReactNode {
  return (
    <div className="bn-section-header">
      {eyebrow ? <p className="bn-section-eyebrow">{eyebrow}</p> : null}
      <h2 className="bn-section-title">{title}</h2>
      {description ? <p className="bn-section-description">{description}</p> : null}
      {actions ? <div className="bn-card-actions mt-2">{actions}</div> : null}
    </div>
  );
}
