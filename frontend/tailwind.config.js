/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        terra: {
          50: "#fdf8f6", 100: "#f9e6dd", 200: "#f2cbb6", 300: "#e8a78a",
          400: "#dc7e5c", 500: "#d46540", 600: "#bf4a2e", 700: "#9e3926",
          800: "#803124", 900: "#6c2d23", 950: "#3a1510",
        },
        cobre: {
          50: "#fdfaf7", 100: "#faf0e4", 200: "#f4dfc6", 300: "#ebc89f",
          400: "#e0ab75", 500: "#d49152", 600: "#c67a47", 700: "#a5633e",
          800: "#865138", 900: "#6d4431", 950: "#3a2118",
        },
      },
    },
  },
  plugins: [],
}
