import { toast } from "@heroui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { dbErrorMessage } from "../lib/validation";
import { logActivity } from "../services/activityLogs";
import {
  addListItem,
  addListItems,
  collectCodes,
  type ItemCategoryInput,
  createList,
  deleteListItem,
  deleteList,
  subscribeLists,
  updateListItem,
  updateListMeta,
} from "../services/lists";
import type { BlastingList, Shift } from "../types";
import { findDuplicate } from "../utils/parse";
import { shiftName } from "../utils/shifts";
import { playSound } from "../utils/sound";

export interface DuplicateMatch {
  date: string;
  shift: string;
  category?: string;
  categoryId?: string;
}

interface UseListsResult {
  lists: BlastingList[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  create: (input: {
    date: string;
    shift: Shift;
    note?: string;
  }) => Promise<string>;
  updateMeta: (
    id: string,
    patch: { date?: string; shift?: Shift; note?: string },
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addItem: (id: string, input: ItemCategoryInput) => Promise<void>;
  addItems: (id: string, inputs: ItemCategoryInput[]) => Promise<number>;
  updateItem: (
    id: string,
    itemId: string,
    patch: { categoryId?: string; categoryName?: string; code?: string },
  ) => Promise<void>;
  removeItem: (id: string, itemId: string) => Promise<void>;
  findDuplicateCode: (
    code: string,
    ignoreCode?: string,
  ) => DuplicateMatch | null;
  getList: (id: string) => BlastingList | undefined;
}

export function useLists(enabled = true): UseListsResult {
  const [lists, setLists] = useState<BlastingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLists([]);
      setError(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    const unsub = subscribeLists(
      (data) => {
        if (!active) return;
        setLists(data);
        setError(null);
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        setError(dbErrorMessage(err));
        setLoading(false);
      },
    );
    return () => {
      active = false;
      unsub();
    };
  }, [tick, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  const codes = useMemo(() => collectCodes(lists), [lists]);

  const findDuplicateCode = useCallback(
    (code: string, ignoreCode?: string) => {
      const candidates = ignoreCode
        ? codes.filter((entry) => entry.code !== ignoreCode)
        : codes;
      return findDuplicate(code, candidates);
    },
    [codes],
  );

  const create = useCallback(
    async (input: { date: string; shift: Shift; note?: string }) => {
      try {
        const id = await createList(input);
        await logActivity(
          "list_create",
          `নতুন তালিকা তৈরি হয়েছে (${input.date} ${shiftName(input.shift, [])})`,
        );
        toast("তালিকা তৈরি হয়েছে", { variant: "success" });
        return id;
      } catch (err) {
        toast(dbErrorMessage(err), { variant: "danger" });
        throw err;
      }
    },
    [],
  );

  const updateMeta = useCallback(
    async (
      id: string,
      patch: { date?: string; shift?: Shift; note?: string },
    ) => {
      try {
        await updateListMeta(id, patch);
        await logActivity("list_update", `তালিকা আপডেট হয়েছে (${id})`);
        toast("তালিকা আপডেট হয়েছে", { variant: "success" });
      } catch (err) {
        toast(dbErrorMessage(err), { variant: "danger" });
        throw err;
      }
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    try {
      await deleteList(id);
      await logActivity("list_delete", `তালিকা মুছে ফেলা হয়েছে (${id})`);
      toast("তালিকা মুছে ফেলা হয়েছে", { variant: "success" });
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
      throw err;
    }
  }, []);

  const addItem = useCallback(async (id: string, input: ItemCategoryInput) => {
    try {
      await addListItem(id, input);
      await logActivity(
        "item_add",
        `[${input.categoryName}] ${input.code} যোগ হয়েছে`,
      );
      playSound("success");
      toast(`${input.code} যোগ হয়েছে`, { variant: "success" });
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
      throw err;
    }
  }, []);

  const addItems = useCallback(
    async (id: string, inputs: ItemCategoryInput[]) => {
      try {
        const count = await addListItems(id, inputs);
        await logActivity("item_add", `${count}টি আইটেম যোগ হয়েছে (${id})`);
        playSound("success");
        toast(`${count}টি আইটেম যোগ হয়েছে`, { variant: "success" });
        return count;
      } catch (err) {
        toast(dbErrorMessage(err), { variant: "danger" });
        throw err;
      }
    },
    [],
  );

  const updateItem = useCallback(
    async (
      id: string,
      itemId: string,
      patch: { categoryId?: string; categoryName?: string; code?: string },
    ) => {
      try {
        await updateListItem(id, itemId, patch);
        await logActivity("item_edit", `${patch.code ?? "আইটেম"} আপডেট হয়েছে`);
        toast("আপডেট হয়েছে", { variant: "success" });
      } catch (err) {
        toast(dbErrorMessage(err), { variant: "danger" });
        throw err;
      }
    },
    [],
  );

  const removeItem = useCallback(async (id: string, itemId: string) => {
    try {
      await deleteListItem(id, itemId);
      await logActivity("item_delete", "একটি আইটেম মুছে ফেলা হয়েছে");
      toast("মুছে ফেলা হয়েছে", { variant: "success" });
    } catch (err) {
      toast(dbErrorMessage(err), { variant: "danger" });
      throw err;
    }
  }, []);

  const getList = useCallback(
    (id: string) => lists.find((l) => l.id === id),
    [lists],
  );

  return {
    lists,
    loading,
    error,
    reload,
    create,
    updateMeta,
    remove,
    addItem,
    addItems,
    updateItem,
    removeItem,
    findDuplicateCode,
    getList,
  };
}
