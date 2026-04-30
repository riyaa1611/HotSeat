/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
          900: "#7f1d1d",
        },
      },
    },
  },
  plugins: [],
};
