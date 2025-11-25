import { useEffect } from "react";

interface UISettings {
  theme: "light" | "dark" | "auto";
  primaryColor: string;
  fontSize: "small" | "medium" | "large";
}

const applyUISettings = (settings: UISettings) => {
  const root = document.documentElement;

  // Áp dụng theme
  if (settings.theme === "dark") {
    root.classList.add("dark");
  } else if (settings.theme === "light") {
    root.classList.remove("dark");
  } else {
    // Auto - theo system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  // Áp dụng màu chủ đạo
  const colorMap: Record<string, { primary: string; ring: string }> = {
    indigo: { primary: "221.2 83.2% 53.3%", ring: "221.2 83.2% 53.3%" },
    blue: { primary: "217.2 91.2% 59.8%", ring: "217.2 91.2% 59.8%" },
    green: { primary: "142.1 76.2% 36.3%", ring: "142.1 76.2% 36.3%" },
    purple: { primary: "262.1 83.3% 57.8%", ring: "262.1 83.3% 57.8%" },
    red: { primary: "0 84.2% 60.2%", ring: "0 84.2% 60.2%" },
    orange: { primary: "24.6 95% 53.1%", ring: "24.6 95% 53.1%" },
  };
  const colors = colorMap[settings.primaryColor] || colorMap.indigo;
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--ring", colors.ring);

  // Áp dụng cỡ chữ
  const fontSizeMap: Record<string, string> = {
    small: "0.875rem", // 14px
    medium: "1rem", // 16px
    large: "1.125rem", // 18px
  };
  const baseFontSize = fontSizeMap[settings.fontSize] || fontSizeMap.medium;
  root.style.setProperty("--base-font-size", baseFontSize);
  root.style.fontSize = baseFontSize;
};

export const useUISettings = () => {
  useEffect(() => {
    const loadAndApply = () => {
      const saved = localStorage.getItem("ui_settings");
      if (!saved) {
        // Apply defaults
        applyUISettings({
          theme: "light",
          primaryColor: "indigo",
          fontSize: "medium",
        });
        return;
      }

      try {
        const settings: UISettings = JSON.parse(saved);
        applyUISettings(settings);
      } catch (error) {
        console.error("Error applying UI settings:", error);
        // Apply defaults on error
        applyUISettings({
          theme: "light",
          primaryColor: "indigo",
          fontSize: "medium",
        });
      }
    };

    loadAndApply();

    // Lắng nghe thay đổi từ SettingsView
    const handleSettingsChange = (e: CustomEvent) => {
      applyUISettings(e.detail as UISettings);
    };

    window.addEventListener("ui-settings-changed", handleSettingsChange as EventListener);

    // Lắng nghe thay đổi system theme nếu chế độ auto
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      const saved = localStorage.getItem("ui_settings");
      if (saved) {
        try {
          const settings: UISettings = JSON.parse(saved);
          if (settings.theme === "auto") {
            applyUISettings(settings);
          }
        } catch {
          // Ignore
        }
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    
    return () => {
      window.removeEventListener("ui-settings-changed", handleSettingsChange as EventListener);
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);
};


