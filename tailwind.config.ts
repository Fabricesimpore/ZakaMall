import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // ZakaMall custom colors
        "zaka-orange": "var(--zaka-orange)",
        "zaka-green": "var(--zaka-green)",
        "zaka-blue": "var(--zaka-blue)",
        "zaka-dark": "var(--zaka-dark)",
        "zaka-gray": "var(--zaka-gray)",
        "zaka-light": "var(--zaka-light)",
        // Status colors for consistency
        "status-success": "var(--zaka-green)",
        "status-warning": "hsl(45 96% 56%)", // Consistent yellow
        "status-error": "hsl(0 84% 60%)", // Consistent red
        "status-info": "var(--zaka-blue)",
        "status-pending": "hsl(45 96% 56%)", // Same as warning
        // Semantic color overrides for brand consistency
        orange: {
          DEFAULT: "var(--zaka-orange)",
          50: "hsl(18 100% 95%)",
          100: "hsl(18 100% 90%)",
          200: "hsl(18 100% 80%)",
          300: "hsl(18 100% 70%)",
          400: "hsl(18 100% 65%)",
          500: "var(--zaka-orange)",
          600: "var(--zaka-orange-hover)",
          700: "hsl(18 100% 45%)",
          800: "hsl(18 100% 35%)",
          900: "hsl(18 100% 25%)",
        },
        blue: {
          DEFAULT: "var(--zaka-blue)",
          50: "hsl(204 78% 95%)",
          100: "hsl(204 78% 90%)",
          200: "hsl(204 78% 80%)",
          300: "hsl(204 78% 70%)",
          400: "hsl(204 78% 65%)",
          500: "var(--zaka-blue)",
          600: "var(--zaka-blue-hover)",
          700: "hsl(204 78% 45%)",
          800: "hsl(204 78% 35%)",
          900: "hsl(204 78% 25%)",
        },
        green: {
          DEFAULT: "var(--zaka-green)",
          50: "hsl(145 63% 95%)",
          100: "hsl(145 63% 90%)",
          200: "hsl(145 63% 80%)",
          300: "hsl(145 63% 70%)",
          400: "hsl(145 63% 60%)",
          500: "var(--zaka-green)",
          600: "var(--zaka-green-hover)",
          700: "hsl(145 63% 40%)",
          800: "hsl(145 63% 30%)",
          900: "hsl(145 63% 20%)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        inter: ["Inter", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
