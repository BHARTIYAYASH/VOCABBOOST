/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        feather: "#58CC02",
        featherDark: "#46A302",
        mask: "#89E219",
        macaw: "#1CB0F6",
        macawDark: "#1899D6",
        cardinal: "#FF4B4B",
        cardinalDark: "#EA2B2B",
        bee: "#FFC800",
        beeDark: "#E6A100",
        fox: "#FF9600",
        foxDark: "#E08600",
        beetle: "#CE82FF",
        beetleDark: "#A568CC",
        eel: "#4B4B4B",
        wolf: "#777777",
        hare: "#AFAFAF",
        swan: "#E5E5E5",
        polar: "#F7F7F7",
        snow: "#FFFFFF",
      },
      fontFamily: {
        nunito: ["Nunito", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1rem",
      },
      boxShadow: {
        card: "0 2px 0 0 #E5E5E5",
      },
    },
  },
  plugins: [],
};
