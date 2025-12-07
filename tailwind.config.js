/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      spacing: {
        'safe-area': 'env(safe-area-inset-bottom)',
      },
      colors: {
        // Remplacement de 'indigo' par une palette 'Ocean Professional'
        // C'est un bleu plus profond et plus sérieux, utilisé par les grandes entreprises tech.
        indigo: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Sky blue vibrant pour les accents
          600: '#0284c7', // Couleur primaire (boutons, liens)
          700: '#0369a1', // Hover
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        slate: {
            850: '#1e293b', // Darker slate for headers
        }
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'glow': '0 0 15px rgba(14, 165, 233, 0.3)',
      }
    },
  },
  plugins: [],
}