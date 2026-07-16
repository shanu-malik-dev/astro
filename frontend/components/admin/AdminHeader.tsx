"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, Menu, Search, Settings, UserCircle } from "lucide-react";

const ADMIN_THEME_KEY = "astronova_admin_accent";
const ADMIN_THEMES = [
  {
    name: "Gold",
    accent: "#B08A2E",
    light: "#D4B463",
    soft: "rgb(176 138 46 / 0.12)",
    softer: "rgb(176 138 46 / 0.16)",
    dark: "#8A6B20",
  },
  {
    name: "Indigo",
    accent: "#4F46E5",
    light: "#818CF8",
    soft: "rgb(79 70 229 / 0.12)",
    softer: "rgb(79 70 229 / 0.16)",
    dark: "#3730A3",
  },
  {
    name: "Emerald",
    accent: "#059669",
    light: "#34D399",
    soft: "rgb(5 150 105 / 0.12)",
    softer: "rgb(5 150 105 / 0.16)",
    dark: "#047857",
  },
  {
    name: "Rose",
    accent: "#E11D48",
    light: "#FB7185",
    soft: "rgb(225 29 72 / 0.12)",
    softer: "rgb(225 29 72 / 0.16)",
    dark: "#BE123C",
  },
  {
    name: "Sky",
    accent: "#0284C7",
    light: "#38BDF8",
    soft: "rgb(2 132 199 / 0.12)",
    softer: "rgb(2 132 199 / 0.16)",
    dark: "#0369A1",
  },
  {
    name: "Violet",
    accent: "#7C3AED",
    light: "#A78BFA",
    soft: "rgb(124 58 237 / 0.12)",
    softer: "rgb(124 58 237 / 0.16)",
    dark: "#6D28D9",
  },
];

function applyAdminTheme(themeName: string) {
  const theme =
    ADMIN_THEMES.find((item) => item.name === themeName) || ADMIN_THEMES[0];

  const applyToElement = (element: HTMLElement) => {
    element.style.setProperty("--admin-accent", theme.accent);
    element.style.setProperty("--admin-accent-light", theme.light);
    element.style.setProperty("--admin-accent-soft", theme.soft);
    element.style.setProperty("--admin-accent-softer", theme.softer);
    element.style.setProperty("--admin-accent-dark", theme.dark);
  };

  applyToElement(document.documentElement);
  document
    .querySelectorAll<HTMLElement>(".admin-theme")
    .forEach(applyToElement);

  return theme;
}

export function AdminHeader({
  userName,
  onLogout,
  onToggleSidebar,
}: {
  userName: string;
  onLogout: () => void;
  onToggleSidebar: () => void;
}) {
  const [selectedTheme, setSelectedTheme] = useState(ADMIN_THEMES[0].name);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(ADMIN_THEME_KEY);
    const theme = applyAdminTheme(savedTheme || ADMIN_THEMES[0].name);

    setSelectedTheme(theme.name);
  }, []);

  const selectTheme = (themeName: string) => {
    const theme = applyAdminTheme(themeName);

    setSelectedTheme(theme.name);
    window.localStorage.setItem(ADMIN_THEME_KEY, theme.name);
    setSettingsOpen(false);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-mist bg-white px-5 text-ink">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-md border border-mist p-2 text-ink/70 lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu size={18} />
      </button>

      <div className="hidden w-full max-w-sm items-center gap-2 rounded-md border border-mist bg-parchment px-3 py-2 text-sm text-ink/45 md:flex">
        <Search size={16} />
        <span>Search here</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button className="rounded-full border border-mist p-2 text-ink/60 transition hover:text-ink" aria-label="Notifications">
          <Bell size={17} />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setSettingsOpen((open) => !open)}
            className="rounded-full border border-mist p-2 text-ink/60 transition hover:text-ink"
            aria-label="Theme settings"
          >
            <Settings size={17} />
          </button>

          {settingsOpen && (
            <div className="absolute right-0 top-12 z-[80] w-64 rounded-lg border border-mist bg-white p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">Theme color</p>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="text-xs font-medium text-ink/45 hover:text-ink"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {ADMIN_THEMES.map((theme) => (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => selectTheme(theme.name)}
                    className={`h-8 w-8 rounded-full border-2 transition ${
                      selectedTheme === theme.name
                        ? "border-ink"
                        : "border-transparent hover:border-mist"
                    }`}
                    style={{ backgroundColor: theme.accent }}
                    aria-label={`Use ${theme.name} theme`}
                    title={theme.name}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-ink/45">
                Selected: {selectedTheme}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-mist px-3 py-1.5">
          <UserCircle size={20} className="text-gold" />
          <span className="max-w-36 truncate text-sm font-medium">{userName}</span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-full border border-mist p-2 text-ink/60 transition hover:bg-red-50 hover:text-red-600"
          aria-label="Logout"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
