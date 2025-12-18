import type { Config } from "tailwindcss";

const config: Config = {
  // [핵심] 다크모드를 'class' 기준으로 작동하게 설정합니다.
  // (html 태그에 'dark' 클래스가 붙으면 다크모드로 변함)
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}", // lib 폴더도 스타일 적용 대상에 추가
    "./content/**/*.{md,mdx}",        // 마크다운 파일도 추가
  ],
  theme: {
    extend: {
      colors: {
        // 다크모드용 변수 연결 (globals.css에서 정의함)
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      // 마크다운 스타일링을 위한 설정 (typography)
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
    // 마크다운 예쁘게 보여주는 플러그인 (없으면 npm install -D @tailwindcss/typography 실행 필요)
    require('@tailwindcss/typography'), 
  ],
};
export default config;