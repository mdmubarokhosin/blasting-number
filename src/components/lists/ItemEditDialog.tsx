import {
  Alert,
  Button,
  FieldError,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
} from "@heroui/react";
import { TriangleAlert } from "../icons";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import type { DuplicateMatch } from "../../hooks/useLists";
import { codeSchema, firstZodError } from "../../lib/validation";
import type { CategoryRecord, ListItem, ShiftRecord } from "../../types";
import {
  activeCategories,
  itemCategoryFields,
  resolveItemCategory,
  sortCategories,
} from "../../utils/categories";
import { shiftLabel } from "../../utils/format";

export function ItemEditDialog({
  item,
  categories,
  shifts = [],
  isOpen,
  onOpenChange,
  findDuplicate,
  onSave,
}: {
  item: ListItem | null;
  categories: CategoryRecord[];
  shifts?: ShiftRecord[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  findDuplicate: (code: string, ignoreCode?: string) => DuplicateMatch | null;
  onSave: (patch: {
    categoryId?: string;
    categoryName: string;
    code: string;
  }) => Promise<void>;
}): ReactNode {
  const initialCategory = useMemo(
    () => (item ? resolveItemCategory(item, categories) : null),
    [item, categories],
  );
  const options = useMemo(() => {
    const active = activeCategories(categories);
    if (
      initialCategory &&
      !active.some((category) => category.id === initialCategory.id)
    ) {
      return sortCategories([...active, initialCategory]);
    }
    return active;
  }, [categories, initialCategory]);

  const [categoryId, setCategoryId] = useState(initialCategory?.id ?? "");
  const [code, setCode] = useState(item?.code ?? "");
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateMatch | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      const resolved = resolveItemCategory(item, categories);
      setCategoryId(resolved.id);
      setCode(item.code);
      setError(null);
      setDuplicate(null);
      setPending(false);
    }
  }, [isOpen, item, categories]);

  const save = async () => {
    setError(null);
    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) {
      setError(firstZodError(parsed.error));
      return;
    }
    const duplicateMatch = findDuplicate(parsed.data, item?.code);
    if (duplicateMatch) {
      setDuplicate(duplicateMatch);
      return;
    }
    const category = options.find((entry) => entry.id === categoryId);
    if (!category) {
      setError("ক্যাটাগরি নির্বাচন করুন");
      return;
    }
    setPending(true);
    try {
      await onSave(itemCategoryFields(category, parsed.data));
      onOpenChange(false);
    } catch {
      // toast handled by caller
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>আইটেম সম্পাদনা</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              {duplicate ? (
                <Alert status="danger">
                  <Alert.Indicator>
                    <TriangleAlert className="size-4" />
                  </Alert.Indicator>
                  <Alert.Content>
                    <Alert.Title>ডুপ্লিকেট কোড</Alert.Title>
                    <Alert.Description>
                      এই কোডটি {duplicate.date} (
                      {shiftLabel(duplicate.shift, shifts)}) তালিকায় আগে থেকেই
                      আছে।
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}

              <Select
                name="edit-category"
                selectedKey={categoryId}
                onSelectionChange={(key) => setCategoryId(String(key))}
              >
                <Label>ক্যাটাগরি</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {options.map((option) => (
                      <ListBox.Item
                        key={option.id}
                        id={option.id}
                        textValue={option.name}
                      >
                        {option.name}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <TextField
                name="edit-code"
                isRequired
                value={code}
                onChange={setCode}
                isInvalid={Boolean(error)}
              >
                <Label>কোড</Label>
                <Input className="bn-mono" />
                {error ? <FieldError>{error}</FieldError> : null}
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onPress={() => onOpenChange(false)}
                isDisabled={pending}
              >
                বাতিল
              </Button>
              <Button isPending={pending} onPress={() => void save()}>
                সংরক্ষণ করুন
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
