/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#00236f",
        "on-primary": "#ffffff",
        "primary-container": "#1e3a8a",
        "on-primary-container": "#90a8ff",
        "primary-fixed": "#dce1ff",
        "on-primary-fixed": "#00164e",
        "on-primary-fixed-variant": "#264191",
        secondary: "#006591",
        "on-secondary": "#ffffff",
        "secondary-container": "#39b8fd",
        "on-secondary-container": "#004666",
        "secondary-fixed": "#c9e6ff",
        "on-secondary-fixed": "#001e2f",
        tertiary: "#272b2d",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#3d4143",
        "tertiary-fixed": "#e0e3e5",
        "on-tertiary-fixed": "#191c1e",
        background: "#f8f9ff",
        "on-background": "#0b1c30",
        surface: "#f8f9ff",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#444651",
        "surface-container": "#e5eeff",
        "surface-container-low": "#eff4ff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "surface-container-lowest": "#ffffff",
        "surface-variant": "#d3e4fe",
        "inverse-surface": "#213145",
        "inverse-on-surface": "#eaf1ff",
        outline: "#757682",
        "outline-variant": "#c5c5d3",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a"
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem"
      },
      spacing: {
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px"
      },
      maxWidth: {
        "container-max": "1280px"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      fontSize: {
        "headline-lg": ["28px", { lineHeight: "36px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "label-md": ["14px", { lineHeight: "20px", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }]
      },
      boxShadow: {
        card: "0 2px 4px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 8px 16px rgba(0, 0, 0, 0.08)"
      }
    }
  },
  plugins: []
};
