/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#0f172a',
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        },
        violet: {
          500: '#8b5cf6',
          600: '#7c3aed',
        }
      }
    },
  },
  plugins: [],
}
