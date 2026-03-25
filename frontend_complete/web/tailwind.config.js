export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#7c6bff",
        bg: "#15161a",
        bgSoft: "#1f2127",
        bgCard: "#262932",
        ok: "#2dd4bf",
        warn: "#f59e0b",
        danger: "#fb7185"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,.35)"
      }
    },
  },
  plugins: [],
};
