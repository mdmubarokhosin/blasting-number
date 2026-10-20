import {
  Alert,
  Button,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { TriangleAlert } from "../icons";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { firstZodError, listMetaSchema } from "../../lib/validation";
import type { Shift, ShiftRecord } from "../../types";
import { todayISO } from "../../utils/format";
import { selectableShifts, shiftTimeLabel } from "../../utils/shifts";

export function ListForm({
  initial,
  shifts,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: { date?: string; shift?: Shift; note?: string };
  shifts: ShiftRecord[];
  submitLabel: string;
  pending?: boolean;
  onSubmit: (value: { date: string; shift: Shift; note: string }) => Promise<void> | void;
  onCancel?: () => void;
}): ReactNode {
  const options = useMemo(
    () => selectableShifts(shifts, initial?.shift),
    [shifts, initial?.shift],
  );
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [shift, setShift] = useState<Shift>(initial?.shift ?? options[0]?.id ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!options.some((option) => option.id === shift)) {
      setShift(options[0]?.id ?? "");
    }
  }, [options, shift]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (options.length === 0) {
      setError("কোনো সক্রিয় শিফট নেই। অ্যাডমিনের সাথে যোগাযোগ করুন।");
      return;
    }
    const parsed = listMetaSchema.safeParse({ date, shift, note });
    if (!parsed.success) {
      setError(firstZodError(parsed.error));
      return;
    }
    await onSubmit(parsed.data);
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      {options.length === 0 ? (
        <Alert status="warning">
          <Alert.Indicator>
            <TriangleAlert className="size-4" />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>কোনো সক্রিয় শিফট নেই</Alert.Title>
            <Alert.Description>
              নতুন তালিকা তৈরির আগে অ্যাডমিন প্যানেলের শিফট ম্যানেজমেন্ট থেকে শিফট তৈরি বা
              সক্রিয় করুন।
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="date" type="date" isRequired value={date} onChange={setDate}>
          <Label>তারিখ</Label>
          <Input />
        </TextField>

        <Select
          name="shift"
          selectedKey={shift || null}
          isDisabled={options.length === 0}
          onSelectionChange={(key) => setShift(String(key))}
        >
          <Label>শিফট</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {options.map((option) => (
                <ListBox.Item key={option.id} id={option.id} textValue={option.name}>
                  <span className="flex w-full items-center justify-between gap-3">
                    <span>
                      {option.name}
                      {option.status === "inactive" ? " (নিষ্ক্রিয়)" : ""}
                    </span>
                    <span className="text-muted text-xs">{shiftTimeLabel(option)}</span>
                  </span>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <TextField name="note" value={note} onChange={setNote}>
        <Label>নোট (ঐচ্ছিক)</Label>
        <TextArea rows={3} placeholder="যেমন: লাইন-৪, সকালের শিফট" />
        <FieldError>{error ?? undefined}</FieldError>
      </TextField>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="secondary" onPress={onCancel}>
            বাতিল
          </Button>
        ) : null}
        <Button type="submit" isPending={pending} isDisabled={options.length === 0}>
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : null}
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
