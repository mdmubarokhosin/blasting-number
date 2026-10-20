import { Button } from "@heroui/react";
import { Moon, Sun } from "../icons";
import { type ReactNode, useState } from "react";
import { applyTheme, getStoredTheme, setTheme, type ThemeMode } from "../../utils/theme";

export function ThemeToggle(): ReactNode {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = getStoredTheme();
    applyTheme(stored);
    return stored;
  });

  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={mode === "dark" ? "লাইট মোড" : "ডার্ক মোড"}
      onPress={() => {
        const next: ThemeMode = mode === "dark" ? "light" : "dark";
        setTheme(next);
        setMode(next);
      }}
    >
      {mode === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
