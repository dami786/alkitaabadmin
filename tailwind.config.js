/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF6F1",
        ivory: "#FFFFFF",
        pine: "#7C2D3A",
        pineDark: "#4A1520",
        moss: "#A34556",
        gold: "#E4B15C",
        goldDeep: "#8C5A12",
        ink: "#2A181C",
        muted: "#6E5A5E",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Segoe UI", "sans-serif"],
        urdu: ["Noto Nastaliq Urdu", "serif"],
      },
      boxShadow: {
        card: "0 18px 50px rgba(74, 21, 32, 0.10)",
      },
    },
  },
  plugins: [],
};
