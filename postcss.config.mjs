/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}, // 👈 v4는 반드시 이걸 써야 합니다!
  },
};

export default config;