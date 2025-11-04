/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        shiny: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' }
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'gradient-y': {
          '0%, 100%': { backgroundPosition: '50% 0%' },
          '50%': { backgroundPosition: '50% 100%' }
        },
        'gradient-xy': {
          '0%, 100%': { backgroundPosition: '0% 50%, 50% 0%' },
          '25%': { backgroundPosition: '100% 50%, 50% 100%' },
          '50%': { backgroundPosition: '100% 50%, 50% 100%' },
          '75%': { backgroundPosition: '0% 50%, 50% 0%' }
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        }
      },
      animation: {
        shiny: 'shiny 2s linear infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'gradient-y': 'gradient-y 3s ease infinite',
        'gradient-xy': 'gradient-xy 3s ease infinite',
        gradientShift: 'gradientShift 4s ease infinite'
      }
    },
  },
  plugins: [],
}

