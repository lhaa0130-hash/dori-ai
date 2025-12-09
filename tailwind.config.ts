import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", 
  
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // (기존 테마 설정 유지)
    },
  },
  // 👇 여기에 플러그인을 추가해야 'prose' 클래스가 작동합니다!
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;