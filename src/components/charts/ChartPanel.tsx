import { Card } from "@heroui/react";
import { BarChart3 } from "../icons";
import { type ReactNode } from "react";
import { EmptyState } from "../common/EmptyState";
import { InlineLoader } from "../common/LoadingScreen";

export function ChartPanel({
  title,
  description,
  loading,
  empty,
  height = 280,
  children,
}: {
  title: string;
  description?: string;
  loading?: boolean;
  empty?: boolean;
  height?: number;
  children: ReactNode;
}): ReactNode {
  return (
    <Card className="bn-card bn-card-center">
      <Card.Header>
        <Card.Title className="text-base">{title}</Card.Title>
        {description ? <Card.Description>{description}</Card.Description> : null}
      </Card.Header>
      <Card.Content className="w-full">
        {loading ? (
          <InlineLoader />
        ) : empty ? (
          <EmptyState
            plain
            icon={BarChart3}
            title="পর্যাপ্ত ডেটা নেই"
            description="এই সময়ে কোনো তথ্য পাওয়া যায়নি।"
          />
        ) : (
          <div className="w-full" style={{ height }}>
            {children}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
