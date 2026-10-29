import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
          from: "var(--color-accent-from)",
          to: "var(--color-accent-to)",
          solid: "var(--color-accent-solid)",
          ink: "var(--color-accent-ink)",
          hover: "var(--color-accent-hover-text)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        "surface-dark": "var(--color-surface-dark)",
        "surface-light": "var(--color-surface-light)",
        "surface-raised": "var(--color-surface-raised)",
        "on-dark": "var(--color-on-dark)",
        "on-light": "var(--color-on-light)",
        "muted-on-dark": "var(--color-muted-on-dark)",
        "muted-on-light": "var(--color-muted-on-light)",
        "border-light": "var(--color-border-light)",
        success: {
          DEFAULT: "var(--color-success-fg)",
          bg: "var(--color-success-bg)",
        },
        warning: {
          DEFAULT: "var(--color-warning-fg)",
          bg: "var(--color-warning-bg)",
        },
        danger: "var(--color-danger-fg)",
      },
      maxWidth: {
        page: "1200px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        cta: "var(--shadow-cta)",
        neon: "var(--shadow-neon)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "var(--radius-control)",
        sm: "12px",
        card: "var(--radius-card)",
        pill: "var(--radius-pill)",
        control: "var(--radius-control)",
      },
      letterSpacing: {
        shop: "-0.02em",
        display: "-0.03em",
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("fine", "@media (pointer: fine)");
      addVariant("coarse", "@media (pointer: coarse)");
    }),
  ],
};
export default config;
