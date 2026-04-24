module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    fontSize: {
      tiny: ".5rem", // 8px
      xs: ".625rem", // 10px
      sm: ".75rem", // 12px (SmallBody)
      base: ".875rem", // 14px (Body)           <p>
      lg: "1rem", // 16px (SmallTitle)          <h3>
      xl: "1.125rem", // 18px (Title)           <h2>
      "2xl": "1.375rem", // 22px (LargeTitle)   <h1>
      "3xl": "1.5rem", // 24px
      "4xl": "1.875rem", // 30px
      "5xl": "2rem", // 32px
      "6xl": ["2.625rem", "3rem"], // 42px
      "7xl": "4rem", // 64px
      "8xl": "8rem", // 128px
    },
    extend: {
      height: {
        viewerHeight: "calc(100vh - 146px)",
        inspectorHeight: "calc(100vh - 70px)",
        jsonViewerHeight: "calc(100vh - 106px)",
        viewerHeightMinimal: "calc(100vh - 106px)",
        inspectorHeightMinimal: "calc(100vh - 30px)",
        jsonViewerHeightMinimal: "calc(100vh - 66px)",
      },
      fontFamily: {
        sans: ["Source Sans Pro", "sans-serif"],
        mono: ["Roboto Mono", "monospace"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "collapsible-down": {
          from: { height: "0" },
          to: { height: "var(--radix-collapsible-content-height)" },
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.2s ease-out",
        "collapsible-up": "collapsible-up 0.2s ease-out",
      },
    },
  },
  variants: {
    outline: ["focus"],
  },
  plugins: [require("@tailwindcss/forms"), require("tailwindcss-radix")()],
};
