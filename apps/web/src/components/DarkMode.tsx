import { Sun, Moon } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";

export const DarkMode = () => {
  const [mode, setMode] = useState<"light" | "dark" | "default">("default");
  useEffect(() => {
    if (mode === "default" && localStorage.theme) {
      setMode(localStorage.theme);
    } else {
      localStorage.theme = mode;
    }

    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [mode]);

  const handleDark = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode]);

  return (
    <div
      onClick={handleDark}
      className="absolute top-2 right-2  bg-blue-500 dark:bg-indigo-500 text-white w-10 h-10 flex justify-center items-center rounded-md"
    >
      {mode === "dark" ? <Sun size={28} /> : <Moon size={28} />}
    </div>
  );
};
