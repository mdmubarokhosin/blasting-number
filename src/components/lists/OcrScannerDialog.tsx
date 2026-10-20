import {
  Alert,
  Button,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { Camera, ScanLine, TriangleAlert } from "../icons";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "@heroui/react";
import type { CategoryRecord } from "../../types";
import type { ItemCategoryInput } from "../../services/lists";
import { selectableCategories } from "../../utils/categories";
import { normalizeEntry } from "../../utils/parse";

interface SimpleWorker {
  recognize: (image: string) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
}

export function OcrScannerDialog({
  isOpen,
  onOpenChange,
  categories,
  onAdd,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryRecord[];
  onAdd: (items: ItemCategoryInput[]) => Promise<number>;
}): ReactNode {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<SimpleWorker | null>(null);
  const categoryOptions = selectableCategories(categories);
  const [categoryId, setCategoryId] = useState(categoryOptions[0]?.id ?? "");
  const selectedCategory =
    categoryOptions.find((option) => option.id === categoryId) ?? categoryOptions[0] ?? null;
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  const stopWorker = async () => {
    const worker = workerRef.current;
    workerRef.current = null;
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // best effort cleanup
      }
    }
  };

  useEffect(() => {
    if (categoryOptions.length > 0 && !categoryOptions.some((option) => option.id === categoryId)) {
      setCategoryId(categoryOptions[0].id);
    }
  }, [categoryId, categoryOptions]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      void stopWorker();
      setImage(null);
      setResult("");
      setCameraError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
      void stopWorker();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("unsupported");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      setCameraError(
        "ক্যামেরা চালু করা যায়নি। অনুমতি দিন অথবা নিচ থেকে ছবি আপলোড করুন।",
      );
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      toast("ক্যামেরা প্রস্তুত নয়", { variant: "warning" });
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setImage(canvas.toDataURL("image/png"));
    toast("ছবি ক্যাপচার হয়েছে — এখন Scan চাপুন", { variant: "success" });
  };

  const onFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const recognize = async () => {
    if (!image) {
      toast("প্রথমে ক্যামেরা বা ছবি থেকে একটি ছবি নির্বাচন করুন", { variant: "warning" });
      return;
    }
    setBusy(true);
    try {
      if (!workerRef.current) {
        const { createWorker } = await import("tesseract.js");
        workerRef.current = (await createWorker("eng")) as unknown as SimpleWorker;
      }
      const output = await workerRef.current.recognize(image);
      const lines = output.data.text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length >= 3 && /[a-zA-Z0-9]/.test(line));
      const unique: string[] = [];
      const seen = new Set<string>();
      for (const line of lines) {
        const parsed = normalizeEntry(line);
        if (!parsed.value) continue;
        const key = parsed.value.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(parsed.value);
      }
      if (unique.length === 0) {
        toast("কোনো কোড শনাক্ত করা যায়নি — পরিষ্কার ছবি চেষ্টা করুন", { variant: "warning" });
      } else {
        setResult(unique.join("\n"));
      }
    } catch {
      toast("OCR প্রক্রিয়া ব্যর্থ হয়েছে", { variant: "danger" });
    } finally {
      setBusy(false);
    }
  };

  const addResult = async () => {
    const codes = result
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (codes.length === 0) {
      toast("যোগ করার জন্য কোনো কোড নেই", { variant: "warning" });
      return;
    }
    setPending(true);
    try {
      if (!selectedCategory) {
        toast("আগে একটি সক্রিয় ক্যাটাগরি যোগ করুন", { variant: "warning" });
        return;
      }
      await onAdd(
        codes.map((code) => ({
          categoryId: selectedCategory.id,
          categoryName: selectedCategory.name,
          code,
        })),
      );
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
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-accent/10 text-accent">
                <ScanLine className="size-5" />
              </Modal.Icon>
              <Modal.Heading>OCR স্ক্যানার</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              {cameraError ? (
                <Alert status="warning">
                  <Alert.Indicator>
                    <TriangleAlert className="size-4" />
                  </Alert.Indicator>
                  <Alert.Content>
                    <Alert.Description>{cameraError}</Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}

              <div className="bg-default relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${cameraReady ? "" : "hidden"}`}
                />
                {!cameraReady && image ? (
                  <img src={image} alt="স্ক্যান করা ছবি" className="h-full w-full object-contain" />
                ) : null}
                {!cameraReady && !image ? (
                  <div className="text-muted flex flex-col items-center gap-2 text-sm">
                    <Camera className="size-8" />
                    ক্যামেরা চালু করুন অথবা ছবি আপলোড করুন
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onPress={() => void startCamera()} isDisabled={busy}>
                  <Camera className="size-4" />
                  ক্যামেরা চালু
                </Button>
                <Button variant="secondary" onPress={capture} isDisabled={!cameraReady || busy}>
                  ছবি তুলুন
                </Button>
                <label className="border-border hover:bg-default inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium">
                  ছবি আপলোড
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => onFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                <Button onPress={() => void recognize()} isPending={busy} isDisabled={!image}>
                  {({ isPending }) => (
                    <>
                      {isPending ? <Spinner color="current" size="sm" /> : <ScanLine className="size-4" />}
                      Scan করুন
                    </>
                  )}
                </Button>
              </div>

              <Select
                name="ocr-category"
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
                    {categoryOptions.map((option) => (
                      <ListBox.Item key={option.id} id={option.id} textValue={option.name}>
                        {option.name}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <TextField name="ocr-result" value={result} onChange={setResult}>
                <Label>শনাক্ত করা কোড (প্রয়োজনে সম্পাদনা করুন)</Label>
                <TextArea rows={5} placeholder="স্ক্যান করার পর এখানে কোড দেখা যাবে" />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={() => onOpenChange(false)} isDisabled={pending}>
                বাতিল
              </Button>
              <Button onPress={() => void addResult()} isPending={pending} isDisabled={!result.trim()}>
                লিস্টে যোগ করুন
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
