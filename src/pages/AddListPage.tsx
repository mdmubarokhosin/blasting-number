import { Card } from "@heroui/react";
import { type ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { ListBrowser } from "../components/lists/ListBrowser";
import { ListForm } from "../components/lists/ListForm";
import { useAuth } from "../features/auth/AuthProvider";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useLists } from "../hooks/useLists";
import type { Shift } from "../types";
import { canEditList } from "../utils/permissions";

export function AddListPage(): ReactNode {
  const { profile, categories, shifts, can } = useAuth();
  const { lists, loading, error, reload, create } = useLists();
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle("নতুন তালিকা");

  const handleCreate = async (value: { date: string; shift: Shift; note: string }) => {
    setPending(true);
    try {
      const id = await create(value);
      navigate(`/lists/${id}`);
    } catch {
      // toast handled by hook
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="নতুন তালিকা"
        description="তারিখ ও শিফট নির্বাচন করে নতুন তালিকা তৈরি করুন।"
        align="center"
      />

      <Card>
        <Card.Content className="p-4 sm:p-6">
          <ListForm
            shifts={shifts}
            submitLabel="তালিকা তৈরি করুন"
            pending={pending}
            onSubmit={handleCreate}
          />
        </Card.Content>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-center text-lg font-semibold">সাম্প্রতিক তালিকা</h2>
        <ListBrowser
          lists={lists.slice(0, 24)}
          categories={categories}
          shifts={shifts}
          loading={loading}
          error={error}
          onRetry={reload}
          canEdit={(list) => canEditList({ list, profile, can })}
        />
      </div>
    </div>
  );
}
