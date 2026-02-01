import type { Config } from "tailwindcss";

const config: Config = {
  // [핵심] 다크모드를 'class' 기준으로 작동하게 설정합니다.
  // (html 태그에 'dark' 클래스가 붙으면 다크모드로 변함)
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{ts,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./dori-ai-vite/**/*.{js,ts,jsx,tsx,mdx}", // verifying if any stray files here
  ],
  prefix: "", // shadcn/ui prefix
  theme: {
    container: { // shadcn/ui container
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // shadcn/ui colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // existing colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // shadcn/ui primary, secondary etc.
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: { // shadcn/ui border radius
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: { // shadcn/ui keyframes
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "mesh-gradient-animation": {
          "0%": {
            "background-position": "0% 0%",
          },
          "100%": {
            "background-position": "100% 100%",
          },
        },
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
      },
      animation: { // shadcn/ui animation
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient-x": "gradient-x 3s ease infinite",
      },
      // existing typography
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%', // prose 너비 제한 해제
          },
        },
      },
    },
  },
  plugins: [
    // existing typography plugin
    require('@tailwindcss/typography'),
    // shadcn/ui plugins
    require("tailwindcss-animate"),
  ],
};
export default config;