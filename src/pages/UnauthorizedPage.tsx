import { Button, Card } from "@heroui/react";
import { ShieldX } from "../components/icons";
import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function UnauthorizedPage(): ReactNode {
  const navigate = useNavigate();
  useDocumentTitle("অনুমতি নেই");
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
      <Card className="w-full">
        <Card.Header className="items-center text-center">
          <span className="bg-danger/10 text-danger mx-auto inline-flex size-14 items-center justify-center rounded-2xl">
            <ShieldX className="size-7" />
          </span>
          <Card.Title className="mt-2">অনুমতি নেই</Card.Title>
          <Card.Description>
            এই পৃষ্ঠাটি শুধু অ্যাডমিন ব্যবহারকারীদের জন্য। প্রয়োজনে অ্যাডমিনের সাথে যোগাযোগ করুন।
          </Card.Description>
        </Card.Header>
        <Card.Footer className="justify-center">
          <Button variant="secondary" onPress={() => navigate("/lists")}>
            তালিকায় ফিরে যান
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}

export function NotFoundPage(): ReactNode {
  const navigate = useNavigate();
  useDocumentTitle("পৃষ্ঠা পাওয়া যায়নি");
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
      <Card className="w-full">
        <Card.Header className="items-center text-center">
          <p className="text-accent text-5xl font-extrabold">৪০৪</p>
          <Card.Title>পৃষ্ঠা পাওয়া যায়নি</Card.Title>
          <Card.Description>আপনি যে পৃষ্ঠাটি খুঁজছেন সেটি নেই বা সরিয়ে ফেলা হয়েছে।</Card.Description>
        </Card.Header>
        <Card.Footer className="justify-center">
          <Button onPress={() => navigate("/lists")}>ড্যাশবোর্ডে যান</Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
