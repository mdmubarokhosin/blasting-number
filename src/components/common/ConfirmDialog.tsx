import { Button, Modal } from "@heroui/react";
import { TriangleAlert } from "../icons";
import { type ReactNode } from "react";

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  message,
  confirmLabel = "নিশ্চিত করুন",
  cancelLabel = "বাতিল",
  danger = true,
  pending = false,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
}): ReactNode {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className={danger ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent"}>
                <TriangleAlert className="size-5" />
              </Modal.Icon>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="text-sm">{message}</div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={() => onOpenChange(false)} isDisabled={pending}>
                {cancelLabel}
              </Button>
              <Button
                variant={danger ? "danger" : "primary"}
                isPending={pending}
                onPress={() => void onConfirm()}
              >
                {confirmLabel}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
