"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, Menu, Moon, Settings, Sun, UserCircle } from "lucide-react";

const ADMIN_THEME_KEY = "astronova_admin_accent";
const ADMIN_MODE_KEY = "astronova_admin_mode";
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
  {
    name: "Amber",
    accent: "#D97706",
    light: "#FBBF24",
    soft: "rgb(217 119 6 / 0.12)",
    softer: "rgb(217 119 6 / 0.16)",
    dark: "#B45309",
  },
  {
    name: "Teal",
    accent: "#0D9488",
    light: "#2DD4BF",
    soft: "rgb(13 148 136 / 0.12)",
    softer: "rgb(13 148 136 / 0.16)",
    dark: "#0F766E",
  },
  {
    name: "Cyan",
    accent: "#0891B2",
    light: "#22D3EE",
    soft: "rgb(8 145 178 / 0.12)",
    softer: "rgb(8 145 178 / 0.16)",
    dark: "#0E7490",
  },
  {
    name: "Fuchsia",
    accent: "#C026D3",
    light: "#E879F9",
    soft: "rgb(192 38 211 / 0.12)",
    softer: "rgb(192 38 211 / 0.16)",
    dark: "#A21CAF",
  },
  {
    name: "Ruby",
    accent: "#DC2626",
    light: "#F87171",
    soft: "rgb(220 38 38 / 0.12)",
    softer: "rgb(220 38 38 / 0.16)",
    dark: "#B91C1C",
  },
  {
    name: "Slate",
    accent: "#475569",
    light: "#94A3B8",
    soft: "rgb(71 85 105 / 0.12)",
    softer: "rgb(71 85 105 / 0.16)",
    dark: "#334155",
  },
  {
    name: "Neon Lime",
    accent: "#65A30D",
    light: "#BEF264",
    soft: "rgb(101 163 13 / 0.12)",
    softer: "rgb(101 163 13 / 0.16)",
    dark: "#4D7C0F",
  },
  {
    name: "Electric Blue",
    accent: "#2563EB",
    light: "#60A5FA",
    soft: "rgb(37 99 235 / 0.12)",
    softer: "rgb(37 99 235 / 0.16)",
    dark: "#1D4ED8",
  },
  {
    name: "Hot Pink",
    accent: "#DB2777",
    light: "#F9A8D4",
    soft: "rgb(219 39 119 / 0.12)",
    softer: "rgb(219 39 119 / 0.16)",
    dark: "#BE185D",
  },
  {
    name: "Laser Orange",
    accent: "#EA580C",
    light: "#FDBA74",
    soft: "rgb(234 88 12 / 0.12)",
    softer: "rgb(234 88 12 / 0.16)",
    dark: "#C2410C",
  },
  {
    name: "Toxic Green",
    accent: "#16A34A",
    light: "#86EFAC",
    soft: "rgb(22 163 74 / 0.12)",
    softer: "rgb(22 163 74 / 0.16)",
    dark: "#15803D",
  },
  {
    name: "Cyber Grape",
    accent: "#9333EA",
    light: "#D8B4FE",
    soft: "rgb(147 51 234 / 0.12)",
    softer: "rgb(147 51 234 / 0.16)",
    dark: "#7E22CE",
  },
  {
    name: "Aqua Blast",
    accent: "#06B6D4",
    light: "#67E8F9",
    soft: "rgb(6 182 212 / 0.12)",
    softer: "rgb(6 182 212 / 0.16)",
    dark: "#0891B2",
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
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(ADMIN_THEME_KEY);
    const savedMode =
      window.localStorage.getItem(ADMIN_MODE_KEY) === "dark" ? "dark" : "light";
    const theme = applyAdminTheme(savedTheme || ADMIN_THEMES[0].name);

    setSelectedTheme(theme.name);
    setMode(savedMode);
    document.documentElement.classList.toggle("admin-dark", savedMode === "dark");
  }, []);

  const selectTheme = (themeName: string) => {
    const theme = applyAdminTheme(themeName);

    setSelectedTheme(theme.name);
    window.localStorage.setItem(ADMIN_THEME_KEY, theme.name);
    setSettingsOpen(false);
  };

  const toggleMode = () => {
    const nextMode = mode === "dark" ? "light" : "dark";

    setMode(nextMode);
    window.localStorage.setItem(ADMIN_MODE_KEY, nextMode);
    document.documentElement.classList.toggle("admin-dark", nextMode === "dark");
  };

  return (
    <header className="admin-topbar flex h-16 items-center justify-between border-b border-mist bg-white px-5 text-ink">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-md border border-mist p-2 text-ink/70 lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu size={18} />
      </button>

      <div className="ml-auto flex items-center gap-3">
        <button className="rounded-full border border-mist p-2 text-ink/60 transition hover:text-ink" aria-label="Notifications">
          <Bell size={17} />
        </button>
        <button
          type="button"
          onClick={toggleMode}
          className="rounded-full border border-mist p-2 text-ink/60 transition hover:text-ink"
          aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={mode === "dark" ? "Light mode" : "Dark mode"}
        >
          {mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
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
