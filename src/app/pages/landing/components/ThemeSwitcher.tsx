"use client";

import { useEffect, useState } from "react";

type Theme = "comic" | "diner";

export default function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState<Theme>("comic");

  useEffect(() => {
    // Load saved theme from localStorage on mount
    const savedTheme = localStorage.getItem("seeJaneSellTheme") as Theme | null;
    if (savedTheme && (savedTheme === "comic" || savedTheme === "diner")) {
      setTheme(savedTheme);
    }
  }, []);

  const setTheme = (theme: Theme) => {
    // Remove all theme classes
    document.body.classList.remove("theme-comic", "theme-diner");

    // Add new theme class
    document.body.classList.add(`theme-${theme}`);

    // Update state
    setActiveTheme(theme);

    // Save to localStorage
    localStorage.setItem("seeJaneSellTheme", theme);
  };

  return (
    <div className="theme-switcher">
      <button
        className={`theme-button comic ${activeTheme === "comic" ? "active" : ""}`}
        onClick={() => setTheme("comic")}
        aria-label="Comic Book Theme"
        title="Comic Book - Bold"
      />
      <button
        className={`theme-button diner ${activeTheme === "diner" ? "active" : ""}`}
        onClick={() => setTheme("diner")}
        aria-label="Diner Theme"
        title="Diner - Fun"
      />
    </div>
  );
}
