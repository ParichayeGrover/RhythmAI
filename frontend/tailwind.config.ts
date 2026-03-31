import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // This hooks up your Navbar!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;