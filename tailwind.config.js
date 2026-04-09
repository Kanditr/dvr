/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          700: '#1a3a5c',
          800: '#162f4a',
          900: '#0f2035',
        }
      }
    },
  },
  plugins: [],
}

