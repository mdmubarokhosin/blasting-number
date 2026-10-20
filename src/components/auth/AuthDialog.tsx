import {
  Alert,
  Button,
  FieldError,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
} from "@heroui/react";
import {
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  TriangleAlert,
  UserPlus,
} from "../icons";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import {
  firstZodError,
  loginSchema,
  registerSchema,
  resetSchema,
} from "../../lib/validation";

export type AuthMode = "login" | "register" | "forgot";

export function AuthDialog({
  isOpen,
  onOpenChange,
  initialMode = "login",
  nextPath,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AuthMode;
  nextPath?: string;
}): ReactNode {
  const { login, register, sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrors({});
      setFormError(null);
      setPending(false);
    }
  }, [isOpen, initialMode]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrors({});
    setFormError(null);
  };

  const goAfterAuth = () => {
    onOpenChange(false);
    navigate(nextPath && nextPath.startsWith("/") ? nextPath : "/lists", {
      replace: true,
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setErrors({});
    setPending(true);
    try {
      if (mode === "login") {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          setErrors({ form: firstZodError(parsed.error) });
          return;
        }
        await login(parsed.data.email, parsed.data.password);
        goAfterAuth();
      } else if (mode === "register") {
        const parsed = registerSchema.safeParse({
          email,
          password,
          displayName,
        });
        if (!parsed.success) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of parsed.error.issues) {
            const key = String(issue.path[0] ?? "form");
            fieldErrors[key] = issue.message;
          }
          setErrors(fieldErrors);
          return;
        }
        await register(
          parsed.data.email,
          parsed.data.password,
          parsed.data.displayName,
        );
        goAfterAuth();
      } else {
        const parsed = resetSchema.safeParse({ email });
        if (!parsed.success) {
          setErrors({ form: firstZodError(parsed.error) });
          return;
        }
        await sendPasswordReset(parsed.data.email);
        switchMode("login");
      }
    } catch {
      // AuthProvider already surfaces a toast; keep the dialog open.
    } finally {
      setPending(false);
    }
  };

  const title =
    mode === "login"
      ? "লগইন"
      : mode === "register"
        ? "নতুন অ্যাকাউন্ট"
        : "পাসওয়ার্ড রিসেট";

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-accent/10 text-accent">
                {mode === "login" ? (
                  <LogIn className="size-5" />
                ) : mode === "register" ? (
                  <UserPlus className="size-5" />
                ) : (
                  <KeyRound className="size-5" />
                )}
              </Modal.Icon>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {formError ? (
                <Alert status="danger" className="mb-4">
                  <Alert.Indicator>
                    <TriangleAlert className="size-4" />
                  </Alert.Indicator>
                  <Alert.Content>
                    <Alert.Description>{formError}</Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}

              <form
                className="flex flex-col gap-4"
                onSubmit={onSubmit}
                noValidate
              >
                {mode === "register" ? (
                  <Alert status="default">
                    <Alert.Indicator>
                      <Eye className="size-4" />
                    </Alert.Indicator>
                    <Alert.Content>
                      <Alert.Title>Viewer অ্যাকাউন্ট</Alert.Title>
                      <Alert.Description>
                        নিরাপত্তার জন্য নতুন অ্যাকাউন্ট শুধু দেখা ও এক্সপোর্টের
                        অনুমতি নিয়ে শুরু হবে। তালিকা তৈরি বা সম্পাদনার জন্য
                        অ্যাডমিনকে Operator রোলে উন্নীত করতে বলুন।
                      </Alert.Description>
                    </Alert.Content>
                  </Alert>
                ) : null}
                {mode === "register" ? (
                  <TextField
                    name="displayName"
                    isRequired
                    value={displayName}
                    onChange={setDisplayName}
                    isInvalid={Boolean(errors.displayName)}
                  >
                    <Label>নাম</Label>
                    <Input placeholder="আপনার নাম" autoComplete="name" />
                    {errors.displayName ? (
                      <FieldError>{errors.displayName}</FieldError>
                    ) : null}
                  </TextField>
                ) : null}

                <TextField
                  name="email"
                  type="email"
                  isRequired
                  value={email}
                  onChange={setEmail}
                  isInvalid={Boolean(errors.email || errors.form)}
                >
                  <Label>ইমেইল</Label>
                  <Input
                    placeholder="you@example.com"
                    autoComplete="email"
                    inputMode="email"
                  />
                  {errors.email ? (
                    <FieldError>{errors.email}</FieldError>
                  ) : null}
                </TextField>

                {mode !== "forgot" ? (
                  <TextField
                    name="password"
                    type={showPassword ? "text" : "password"}
                    isRequired
                    value={password}
                    onChange={setPassword}
                    isInvalid={Boolean(errors.password)}
                  >
                    <Label>পাসওয়ার্ড</Label>
                    <div className="relative">
                      <Input
                        className="w-full pr-10"
                        autoComplete={
                          mode === "login" ? "current-password" : "new-password"
                        }
                        placeholder="কমপক্ষে ৬ অক্ষর"
                      />
                      <Button
                        type="button"
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="absolute top-1/2 right-1 -translate-y-1/2"
                        aria-label={
                          showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"
                        }
                        onPress={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                    </div>
                    {errors.password ? (
                      <FieldError>{errors.password}</FieldError>
                    ) : null}
                  </TextField>
                ) : null}

                <Button type="submit" fullWidth isPending={pending}>
                  {({ isPending }) => (
                    <>
                      {isPending ? <Spinner color="current" size="sm" /> : null}
                      {mode === "login"
                        ? "লগইন করুন"
                        : mode === "register"
                          ? "অ্যাকাউন্ট খুলুন"
                          : "রিসেট লিংক পাঠান"}
                    </>
                  )}
                </Button>
              </form>
            </Modal.Body>
            <Modal.Footer className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
              {mode === "login" ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    isDisabled={pending}
                    onPress={() => switchMode("register")}
                  >
                    অ্যাকাউন্ট নেই? রেজিস্টার করুন
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    isDisabled={pending}
                    onPress={() => switchMode("forgot")}
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  isDisabled={pending}
                  onPress={() => switchMode("login")}
                >
                  লগইনে ফিরে যান
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
