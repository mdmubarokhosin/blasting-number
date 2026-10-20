import { Card } from "@heroui/react";
import { type ReactNode, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingScreen } from "../components/common/LoadingScreen";
import { PageHeader } from "../components/common/PageHeader";
import { ListForm } from "../components/lists/ListForm";
import { useAuth } from "../features/auth/AuthProvider";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useLists } from "../hooks/useLists";
import type { Shift } from "../types";
import { canEditList } from "../utils/permissions";
import { shiftLabel } from "../utils/format";

export function EditListPage(): ReactNode {
  const { listId } = useParams<{ listId: string }>();
  const { profile, shifts, can } = useAuth();
  const { getList, loading, updateMeta } = useLists();
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle("তালিকা সম্পাদনা");

  if (loading) return <LoadingScreen label="তালিকা লোড হচ্ছে..." />;
  const list = listId ? getList(listId) : undefined;
  if (!list) {
    return (
      <EmptyState
        title="তালিকা পাওয়া যায়নি"
        description="তালিকাটি মুছে ফেলা হয়েছে অথবা লিংকটি ভুল।"
      />
    );
  }
  if (!canEditList({ list, profile, can })) {
    return <Navigate to={`/lists/${list.id}`} replace />;
  }

  const handleSubmit = async (value: { date: string; shift: Shift; note: string }) => {
    setPending(true);
    try {
      await updateMeta(list.id, value);
      navigate(`/lists/${list.id}`);
    } catch {
      // toast handled by hook
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader
        title="তালিকা সম্পাদনা"
        description={`${list.date} · ${shiftLabel(list.shift, shifts)}`}
        align="center"
      />
      <Card>
        <Card.Content className="p-4 sm:p-6">
          <ListForm
            shifts={shifts}
            initial={{ date: list.date, shift: list.shift, note: list.note }}
            submitLabel="সংরক্ষণ করুন"
            pending={pending}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/lists/${list.id}`)}
          />
        </Card.Content>
      </Card>
    </div>
  );
}
