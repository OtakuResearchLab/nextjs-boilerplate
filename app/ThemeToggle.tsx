"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("otaku-lab-theme");

    const shouldUseDark =
      savedTheme === "dark";

    document.documentElement.classList.toggle(
      "dark",
      shouldUseDark
    );

    setIsDark(shouldUseDark);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;

    setIsDark(nextDark);

    document.documentElement.classList.toggle(
      "dark",
      nextDark
    );

    localStorage.setItem(
      "otaku-lab-theme",
      nextDark ? "dark" : "light"
    );
  };

  if (!mounted) {
    return (
      <div
        className="h-11 w-11 shrink-0 rounded-full border border-[#ccd4da] bg-white"
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isDark
          ? "切換為亮色模式"
          : "切換為暗色模式"
      }
      title={
        isDark
          ? "開燈｜切換為亮色模式"
          : "關燈｜切換為暗色模式"
      }
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ccd4da] bg-white text-xl shadow-sm transition hover:scale-105 hover:bg-[#f1f3f4]"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
