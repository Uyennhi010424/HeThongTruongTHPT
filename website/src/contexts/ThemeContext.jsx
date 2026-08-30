import React, { createContext, useContext, useEffect, useState } from "react";
import { getAdminConfigs } from "../api/adminConfigApi";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState("light");
  const [themeColor, setThemeColor] = useState("#00236f"); // default primary
  const [themeLogo, setThemeLogo] = useState("/logo.png");
  const [themeFavicon, setThemeFavicon] = useState("/logo.png");
  const [systemName, setSystemName] = useState("EduManager Pro");
  const [themeFooter, setThemeFooter] = useState("© 2026 EduManager Pro. All rights reserved.");

  const applyTheme = (mode, color) => {
    // 1. Dark Mode Toggle
    const isDark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 2. CSS Variable override for theme_color (Primary Color)
    if (color) {
      let styleTag = document.getElementById("dynamic-theme-color");
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "dynamic-theme-color";
        document.head.appendChild(styleTag);
      }
      
      styleTag.innerHTML = `
        :root, html.dark {
          --theme-primary: ${color} !important;
        }
      `;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchConfigs = async () => {
      try {
        const res = await getAdminConfigs();
        const data = res?.data?.data || [];
        const mode = data.find((c) => c.configKey === "theme_mode")?.configValue || "light";
        const color = data.find((c) => c.configKey === "theme_color")?.configValue || "#00236f";
        const logo = data.find((c) => c.configKey === "theme_logo")?.configValue || "/logo.png";
        const favicon = data.find((c) => c.configKey === "theme_favicon")?.configValue || "/logo.png";
        const sysName = data.find((c) => c.configKey === "system_name")?.configValue || "EduManager Pro";
        const footer = data.find((c) => c.configKey === "theme_footer")?.configValue || "© 2026 EduManager Pro. All rights reserved.";
        
        if (isMounted) {
          setThemeMode(mode);
          setThemeColor(color);
          setThemeLogo(logo.startsWith("/") || logo.startsWith("http") ? logo : `http://localhost:8080${logo}`);
          setThemeFavicon(favicon.startsWith("/") || favicon.startsWith("http") ? favicon : `http://localhost:8080${favicon}`);
          setSystemName(sysName);
          setThemeFooter(footer);
          applyTheme(mode, color);
          
          // Apply Favicon
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = favicon.startsWith("/") || favicon.startsWith("http") ? favicon : `http://localhost:8080${favicon}`;
          
          // Apply Title
          const title = data.find((c) => c.configKey === "website_title")?.configValue;
          if (title) document.title = title;
        }
      } catch (err) {
        console.error("Failed to load theme config:", err);
      }
    };
    fetchConfigs();
    return () => { isMounted = false; };
  }, []);

  const updateThemeState = (mode, color, logo, favicon, sysName, footer) => {
    if (mode) setThemeMode(mode);
    if (color) setThemeColor(color);
    if (logo) setThemeLogo(logo.startsWith("/") || logo.startsWith("http") ? logo : `http://localhost:8080${logo}`);
    if (favicon) {
      const favUrl = favicon.startsWith("/") || favicon.startsWith("http") ? favicon : `http://localhost:8080${favicon}`;
      setThemeFavicon(favUrl);
      let link = document.querySelector("link[rel~='icon']");
      if (link) link.href = favUrl;
    }
    if (sysName) setSystemName(sysName);
    if (footer !== undefined) setThemeFooter(footer);
    applyTheme(mode || themeMode, color || themeColor);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, themeColor, themeLogo, themeFavicon, systemName, themeFooter, updateThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
