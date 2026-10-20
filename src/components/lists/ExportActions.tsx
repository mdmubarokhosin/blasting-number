import { Button } from "@heroui/react";
import { FileDown, FileSpreadsheet, MessageCircle } from "../icons";
import { type ReactNode, useState } from "react";
import { toast } from "@heroui/react";
import { useAuth } from "../../features/auth/AuthProvider";
import { logActivity } from "../../services/activityLogs";
import type { BlastingList, CategoryRecord, ShiftRecord } from "../../types";
import { exportCsv, exportPdf, shareToWhatsApp } from "../../utils/exports";

export function ExportActions({
  list,
  categories,
  shifts,
}: {
  list: BlastingList;
  categories: CategoryRecord[];
  shifts: ShiftRecord[];
}): ReactNode {
  const { settings, profile } = useAuth();
  const [pdfPending, setPdfPending] = useState(false);
  const generatedBy = profile?.displayName || profile?.email || "unknown";

  const handlePdf = async () => {
    setPdfPending(true);
    try {
      await exportPdf(list, generatedBy, categories, shifts);
      void logActivity("export_pdf", `PDF রিপোর্ট তৈরি (${list.date})`);
      toast("PDF ডাউনলোড শুরু হয়েছে", { variant: "success" });
    } catch {
      toast("PDF তৈরি করা যায়নি", { variant: "danger" });
    } finally {
      setPdfPending(false);
    }
  };

  const handleCsv = () => {
    try {
      exportCsv(list, categories, shifts);
      void logActivity("export_csv", `CSV রিপোর্ট তৈরি (${list.date})`);
      toast("CSV ডাউনলোড শুরু হয়েছে", { variant: "success" });
    } catch {
      toast("CSV তৈরি করা যায়নি", { variant: "danger" });
    }
  };

  const handleShare = () => {
    if (Object.keys(list.items).length === 0) {
      toast("শেয়ার করার জন্য কোনো আইটেম নেই", { variant: "warning" });
      return;
    }
    shareToWhatsApp(list, categories, shifts);
  };

  return (
    <>
      {settings.features.pdfExport ? (
        <Button
          size="sm"
          variant="secondary"
          isPending={pdfPending}
          onPress={() => void handlePdf()}
        >
          <FileDown className="size-4" />
          PDF
        </Button>
      ) : null}
      {settings.features.csvExport ? (
        <Button size="sm" variant="secondary" onPress={handleCsv}>
          <FileSpreadsheet className="size-4" />
          CSV
        </Button>
      ) : null}
      {settings.features.whatsappShare ? (
        <Button size="sm" variant="secondary" onPress={handleShare}>
          <MessageCircle className="size-4" />
          WhatsApp
        </Button>
      ) : null}
    </>
  );
}
