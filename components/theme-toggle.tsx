"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Check cookie or system preference on mount
    const savedTheme = document.cookie
      .split("; ")
      .find((row) => row.startsWith("theme="))
      ?.split("=")[1];

    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme as "light" | "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    // Update HTML class
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Set cookie for server-side hydration (expires in 1 year)
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-10 h-10 rounded-2xl bg-primary/5 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-300"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 transition-all duration-500 hover:rotate-12" />
      ) : (
        <Sun className="w-5 h-5 transition-all duration-500 hover:rotate-90" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
