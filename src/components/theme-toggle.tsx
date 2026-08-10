"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme-context";
import { useTranslation } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themes: Array<{ value: "light" | "dark" | "system"; icon: React.ReactNode; labelKey: string }> = [
    { value: "light", icon: <Sun className="h-4 w-4" />, labelKey: "theme.light" },
    { value: "dark", icon: <Moon className="h-4 w-4" />, labelKey: "theme.dark" },
    { value: "system", icon: <Monitor className="h-4 w-4" />, labelKey: "theme.system" },
  ];

  // Show a placeholder button during SSR to avoid Base UI hydration errors
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
        <Sun className="h-4 w-4" />
        <span className="sr-only">{t("theme.label")}</span>
      </Button>
    );
  }

  const currentTheme = themes.find((t) => t.value === theme) || themes[2];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="h-9 w-9">
            {currentTheme.icon}
            <span className="sr-only">{t(currentTheme.labelKey)}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {themes.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => setTheme(item.value)}
            className={theme === item.value ? "font-medium" : ""}
          >
            {item.icon}
            <span className="ml-2">{t(item.labelKey)}</span>
            {theme === item.value && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
