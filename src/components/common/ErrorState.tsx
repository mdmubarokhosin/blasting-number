import { Alert, Button } from "@heroui/react";
import { RefreshCw, TriangleAlert } from "../icons";
import { type ReactNode } from "react";

export function ErrorState({
  title = "কিছু একটা সমস্যা হয়েছে",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}): ReactNode {
  return (
    <Alert status="danger">
      <Alert.Indicator>
        <TriangleAlert className="size-5" />
      </Alert.Indicator>
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        {message ? <Alert.Description>{message}</Alert.Description> : null}
      </Alert.Content>
      {onRetry ? (
        <Button size="sm" variant="danger" onPress={onRetry}>
          <RefreshCw className="size-4" />
          আবার চেষ্টা করুন
        </Button>
      ) : null}
    </Alert>
  );
}
