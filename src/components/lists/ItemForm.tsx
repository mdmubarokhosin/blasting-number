import {
  Alert,
  Button,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { Plus, TriangleAlert } from "../icons";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "@heroui/react";
import type { CategoryRecord, ShiftRecord } from "../../types";
import { normalizeEntry } from "../../utils/parse";
import type { DuplicateMatch } from "../../hooks/useLists";
import type { ItemCategoryInput } from "../../services/lists";
import { selectableCategories } from "../../utils/categories";
import { shiftLabel } from "../../utils/format";

export type PendingItem = ItemCategoryInput;

export function ItemForm({
  categories,
  shifts = [],
  onAdd,
  findDuplicate,
}: {
  categories: CategoryRecord[];
  shifts?: ShiftRecord[];
  onAdd: (items: PendingItem[]) => Promise<number>;
  findDuplicate: (code: string) => DuplicateMatch | null;
}): ReactNode {
  const options = useMemo(() => selectableCategories(categories), [categories]);
  const [categoryId, setCategoryId] = useState(options[0]?.id ?? "");
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [duplicates, setDuplicates] = useState<
    { code: string; match: DuplicateMatch }[]
  >([]);

  useEffect(() => {
    if (!options.some((category) => category.id === categoryId)) {
      setCategoryId(options[0]?.id ?? "");
    }
  }, [options, categoryId]);

  const selectedCategory =
    options.find((category) => category.id === categoryId) ?? null;

  const parse = (): {
    items: PendingItem[];
    duplicates: { code: string; match: DuplicateMatch }[];
  } => {
    if (!selectedCategory) return { items: [], duplicates: [] };
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const items: PendingItem[] = [];
    const found: { code: string; match: DuplicateMatch }[] = [];
    const seen = new Set<string>();
    for (const line of lines) {
      const parsed = normalizeEntry(line);
      if (!parsed.value) continue;
      if (seen.has(parsed.value.toLowerCase())) continue;
      seen.add(parsed.value.toLowerCase());
      const match = findDuplicate(parsed.value);
      if (match) {
        found.push({ code: parsed.value, match });
      } else {
        items.push({
          categoryId: selectedCategory.id,
          categoryName: selectedCategory.name,
          code: parsed.value,
        });
      }
    }
    return { items, duplicates: found };
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCategory) {
      toast("আগে অ্যাডমিন থেকে একটি সক্রিয় ক্যাটাগরি যোগ করুন", {
        variant: "warning",
      });
      return;
    }
    const { items, duplicates: found } = parse();
    setDuplicates(found);
    if (items.length === 0) {
      if (found.length > 0) {
        toast("সবগুলো কোড ইতিমধ্যে অন্য তালিকায় আছে", { variant: "warning" });
      } else {
        toast("যোগ করার জন্য অন্তত একটি কোড লিখুন", { variant: "warning" });
      }
      return;
    }
    setPending(true);
    try {
      await onAdd(items);
      setText("");
      setDuplicates(found);
    } catch {
      // toast handled by caller
    } finally {
      setPending(false);
    }
  };

  const previewCount = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;

  if (options.length === 0) {
    return (
      <Alert status="warning">
        <Alert.Indicator>
          <TriangleAlert className="size-4" />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>কোনো সক্রিয় ক্যাটাগরি নেই</Alert.Title>
          <Alert.Description>
            কোড যোগ করার আগে অ্যাডমিন প্যানেলের ক্যাটাগরি ম্যানেজমেন্ট থেকে
            ক্যাটাগরি তৈরি বা সক্রিয় করুন।
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <Select
          name="category"
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

        <TextField name="codes" value={text} onChange={setText}>
          <Label>কোড (প্রতি লাইনে একটি)</Label>
          <TextArea
            rows={4}
            placeholder={"A1-L12-BM-1011 1/2\nA1-L12-BM-1012\nIM-2043-07 10Pcs"}
          />
        </TextField>
      </div>

      {duplicates.length > 0 ? (
        <Alert status="warning">
          <Alert.Indicator>
            <TriangleAlert className="size-4" />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>
              {duplicates.length}টি ডুপ্লিকেট বাদ দেওয়া হয়েছে
            </Alert.Title>
            <Alert.Description>
              {duplicates
                .slice(0, 4)
                .map(
                  (entry) =>
                    `${entry.code} → ${entry.match.date} (${shiftLabel(entry.match.shift, shifts)})`,
                )
                .join("; ")}
              {duplicates.length > 4 ? " ..." : ""}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted text-xs">
          {previewCount > 0
            ? `${previewCount}টি লাইন প্রস্তুত`
            : "একাধিক কোড একসাথে যোগ করতে পারেন"}
        </p>
        <Button
          type="submit"
          isDisabled={previewCount === 0}
          isPending={pending}
        >
          {({ isPending }) => (
            <>
              {isPending ? (
                <Spinner color="current" size="sm" />
              ) : (
                <Plus className="size-4" />
              )}
              কোড যোগ করুন
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
